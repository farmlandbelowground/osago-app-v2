-- ============================================================
-- 0011 — appointment_bookings.reminder_*_sent_at (server-cron dedupe)
-- ============================================================
-- De 24u- en 1u-reminders draaiden tot nu toe in de browser via een
-- setInterval-dispatcher — reminders vuurden dus alleen wanneer er
-- toevallig iemand ingelogd was op het juiste moment. In productie
-- betekent dat: de meeste reminders gaan nooit uit.
--
-- Deze migratie voegt twee timestamp-kolommen toe aan appointment_bookings
-- zodat api/cron/appointment-reminders.js kan bepalen welke boekingen al
-- gemarkeerd zijn en dubbele sends kan voorkomen. Werken parallel aan de
-- bestaande `sent_reminders`-array op subscriptions (zelfde pattern).
-- Idempotent.
-- ============================================================

alter table public.appointment_bookings
  add column if not exists reminder_24h_sent_at timestamptz,
  add column if not exists reminder_1h_sent_at  timestamptz;

comment on column public.appointment_bookings.reminder_24h_sent_at is
  '24u-reminder verzonden op dit moment. Gezet door api/cron/appointment-reminders.js om dubbele sends te voorkomen.';
comment on column public.appointment_bookings.reminder_1h_sent_at is
  '1u-reminder verzonden op dit moment. Idem.';

-- Index voor de cron-query: bookings met status=confirmed en start_at in de
-- reminder-vensters. Filter op status via partial index — non-confirmed telt
-- niet mee en zou de index onnodig opblazen.
create index if not exists appointment_bookings_reminder_scan_idx
  on public.appointment_bookings (starts_at)
  where status = 'confirmed'
    and (reminder_24h_sent_at is null or reminder_1h_sent_at is null);
