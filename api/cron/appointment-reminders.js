// Vercel Cron — elke 15 minuten. Verstuurt de 24u- en 1u-herinnering voor
// bookings die het corresponderende venster binnenkomen.
//
// Waarom een cron en niet browser-side setInterval? De oude implementatie
// stond in de bundle-runtime — reminders vuurden alleen zolang iemand
// ingelogd was. In productie betekent dat: de meeste reminders gaan nooit
// uit. Deze cron neemt de fakkel over.
//
// Vensters (matcht de browser-tolerance van ±30 min zodat migratie geen
// double-of-none oplevert):
//   - 24u-reminder: bookings met starts_at in [now + 23:30, now + 24:30]
//   - 1u-reminder:  bookings met starts_at in [now + 00:30, now + 01:30]
//
// De cron draait elke 15 min → elke booking zit in max 4 scan-vensters →
// zelfs bij één skip is er nog kans om te vuren. Idempotency via de nieuwe
// reminder_24h_sent_at / reminder_1h_sent_at kolommen (migratie 0011).

import { sendTemplatedMail } from '../_email.js';

async function supabaseFetch(path, opts = {}){
  const url = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url || !svc) throw new Error('Supabase server-config ontbreekt.');
  const headers = Object.assign({
    apikey: svc,
    Authorization: `Bearer ${svc}`,
    'Content-Type': 'application/json'
  }, opts.headers || {});
  const res = await fetch(`${url}${path}`, { ...opts, headers });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

// Datum/tijd-formatters die de browser-versies matchen (locale=nl-NL,
// timezone=Europe/Amsterdam). Server-side draait Vercel op UTC, dus expliciete
// timeZone-optie is nodig om zomertijd-shifts te vermijden.
const AMS = 'Europe/Amsterdam';
function fmtAppointmentDate(iso){
  const d = new Date(iso);
  return d.toLocaleDateString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: AMS
  });
}
function fmtAppointmentTime(iso){
  const d = new Date(iso);
  return d.toLocaleTimeString('nl-NL', {
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: AMS
  });
}
function appointmentLocationLabel(type){
  if(!type) return '';
  const loc = (type.location || '').toLowerCase();
  if(loc === 'video')    return 'Video-gesprek';
  if(loc === 'phone')    return 'Telefonisch';
  if(loc === 'inperson') return type.location_details || 'Op locatie';
  return type.location_details || type.location || '';
}

export default async function handler(req, res){
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  if(!secret || authHeader !== `Bearer ${secret}`){
    return res.status(401).json({ error: 'Ongeldige cron-token.' });
  }

  const now  = Date.now();
  const iso  = (t) => new Date(t).toISOString();
  const min  = 60_000;
  const hour = 60 * min;

  // Twee ranges tegelijk fetchen zou een OR-query vragen — PostgREST kan dat
  // maar leest ondubbelzinniger als we ze splitsen. Twee kleine SELECT's.
  const range24 = {
    start: iso(now + 23 * hour + 30 * min),
    end:   iso(now + 24 * hour + 30 * min)
  };
  const range1 = {
    start: iso(now + 30 * min),
    end:   iso(now + 90 * min)
  };

  const cols = 'id,appointment_type_id,admin_id,user_id,guest_email,guest_name,guest_first_name,starts_at,ends_at,reminder_24h_sent_at,reminder_1h_sent_at';
  const [b24Res, b1Res] = await Promise.all([
    supabaseFetch(`/rest/v1/appointment_bookings?status=eq.confirmed&reminder_24h_sent_at=is.null&starts_at=gte.${range24.start}&starts_at=lte.${range24.end}&select=${cols}`),
    supabaseFetch(`/rest/v1/appointment_bookings?status=eq.confirmed&reminder_1h_sent_at=is.null&starts_at=gte.${range1.start}&starts_at=lte.${range1.end}&select=${cols}`)
  ]);
  if(!b24Res.ok) return res.status(502).json({ error: 'Kon 24u-bookings niet ophalen.', details: b24Res.data });
  if(!b1Res.ok)  return res.status(502).json({ error: 'Kon 1u-bookings niet ophalen.',  details: b1Res.data });

  // Combineer en dedupe (een booking kan in principe niet in beide ranges
  // zitten omdat de vensters uren uit elkaar liggen, maar we labelen 'em
  // expliciet zodat de sendloop weet welk template te gebruiken).
  const jobs = [
    ...(Array.isArray(b24Res.data) ? b24Res.data : []).map(b => ({ kind: '24h', booking: b })),
    ...(Array.isArray(b1Res.data)  ? b1Res.data  : []).map(b => ({ kind: '1h',  booking: b }))
  ];
  if(jobs.length === 0) return res.status(200).json({ total: 0, sent: 0 });

  // Types en admins zijn N per booking-set — batch-fetch met IN-clauses
  // scheelt N supabase-calls binnen de loop.
  const typeIds  = [...new Set(jobs.map(j => j.booking.appointment_type_id).filter(Boolean))];
  const adminIds = [...new Set(jobs.map(j => j.booking.admin_id).filter(Boolean))];
  const [typesRes, adminsRes] = await Promise.all([
    typeIds.length
      ? supabaseFetch(`/rest/v1/appointment_types?id=in.(${typeIds.map(encodeURIComponent).join(',')})&select=id,name,duration,location,location_details`)
      : Promise.resolve({ ok: true, data: [] }),
    adminIds.length
      ? supabaseFetch(`/rest/v1/profiles?id=in.(${adminIds.map(encodeURIComponent).join(',')})&select=id,first_name,last_name,email,phone`)
      : Promise.resolve({ ok: true, data: [] })
  ]);
  const typeById  = new Map((typesRes.data  || []).map(t => [t.id, t]));
  const adminById = new Map((adminsRes.data || []).map(a => [a.id, a]));

  const report = { total: jobs.length, sent: 0, skipped: 0, errors: [] };
  for(const { kind, booking } of jobs){
    try {
      if(!booking.guest_email){ report.skipped++; continue; }
      const type  = typeById.get(booking.appointment_type_id) || null;
      const admin = adminById.get(booking.admin_id) || null;
      if(!type){
        report.errors.push({ booking_id: booking.id, error: `appointment_type ${booking.appointment_type_id} niet gevonden` });
        continue;
      }

      const adminName = admin
        ? `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'Osago'
        : 'Osago';

      const vars = {
        klantnaam:           booking.guest_name || booking.guest_first_name || '',
        afspraak_type:       type.name || '',
        afspraak_datum:      fmtAppointmentDate(booking.starts_at),
        afspraak_tijd:       `${fmtAppointmentTime(booking.starts_at)} – ${fmtAppointmentTime(booking.ends_at)}`,
        afspraak_starttijd:  fmtAppointmentTime(booking.starts_at),
        afspraak_duur:       `${type.duration || 30} minuten`,
        afspraak_locatie:    appointmentLocationLabel(type),
        adviseur_naam:       adminName,
        adviseur_email:      (admin && admin.email) || 'support@osago.nl',
        adviseur_telefoon:   (admin && admin.phone) || ''
      };

      const templateId = kind === '24h'
        ? 'appointment_reminder_24h_customer'
        : 'appointment_reminder_1h_customer';

      const send = await sendTemplatedMail(templateId, booking.guest_email, vars, {
        context: 'cron.appointment-reminders',
        related: { bookingId: booking.id, userId: booking.user_id, kind }
      });
      if(!send.ok){
        report.errors.push({ booking_id: booking.id, kind, error: send.error || send.reason });
        continue;
      }
      report.sent++;

      // Markeer voordat we naar de volgende job gaan; bij een double-fire
      // van de cron voorkomt dit een tweede send. Fire-and-forget: als de
      // patch faalt is worst-case één dubbele reminder — beter dan de mail
      // niet loggen.
      const nowIso = new Date().toISOString();
      const patch  = kind === '24h'
        ? { reminder_24h_sent_at: nowIso }
        : { reminder_1h_sent_at:  nowIso };
      await supabaseFetch(`/rest/v1/appointment_bookings?id=eq.${encodeURIComponent(booking.id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(patch)
      }).catch(() => {});
    } catch(err){
      report.errors.push({ booking_id: booking.id, error: String(err && err.message || err) });
    }
  }

  return res.status(200).json(report);
}
