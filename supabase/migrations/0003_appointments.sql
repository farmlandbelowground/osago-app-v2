-- ============================================================
-- 0003 — Appointment types + bookings (publieke boekingspagina)
-- ============================================================
-- Tot nu toe leefden afspraaktypen en boekingen alleen in localStorage:
--   - admin-types stonden enkel in de browser van de admin;
--   - een (uitgelogde) boeker schreef naar zíjn eigen localStorage, dus de
--     admin zag de boeking nooit in de database (alleen via de mail).
-- Deze migratie zet beide in Supabase zodat:
--   - de publieke /afspraak/<slug>-pagina het type uit de DB kan laden
--     (anon SELECT van actieve types);
--   - een uitgelogde bezoeker een boeking kan aanmaken (anon INSERT);
--   - de admin alle boekingen centraal ziet.
--
-- Id's zijn TEXT en houden de bestaande app-id's aan ('apt_...' / 'apb_...'),
-- zodat de client-koppelingen (assignedAdminIds, appointmentTypeId) niet hoeven
-- te veranderen. Veilig om meerdere keren te draaien.
-- ============================================================

-- ── appointment_types ──────────────────────────────────────
create table if not exists public.appointment_types (
  id                 text primary key,
  slug               text not null unique,
  name               text not null,
  description        text,
  duration           int  not null default 30,
  buffer_after       int  not null default 0,
  advance_notice_min int  not null default 60,
  rolling_days       int  not null default 30,
  color              text,
  location           text,
  location_details   text,
  active             boolean not null default true,
  assigned_admin_ids jsonb not null default '[]'::jsonb,
  created_at         timestamptz not null default now(),
  created_by         text,
  updated_at         timestamptz not null default now()
);

create index if not exists appointment_types_slug_idx   on public.appointment_types(slug);
create index if not exists appointment_types_active_idx  on public.appointment_types(active) where active = true;

-- ── appointment_bookings ───────────────────────────────────
create table if not exists public.appointment_bookings (
  id                   text primary key,
  appointment_type_id  text references public.appointment_types(id) on delete set null,
  admin_id             text,
  user_id              uuid references auth.users(id) on delete set null,
  guest_first_name     text,
  guest_last_name      text,
  guest_name           text,
  guest_email          text,
  guest_phone          text,
  starts_at            timestamptz,
  ends_at              timestamptz,
  status               text not null default 'confirmed',
  notes                text,
  cancelled_at         timestamptz,
  cancelled_by         text,
  created_at           timestamptz not null default now()
);

create index if not exists appointment_bookings_type_idx  on public.appointment_bookings(appointment_type_id);
create index if not exists appointment_bookings_starts_idx on public.appointment_bookings(starts_at);
create index if not exists appointment_bookings_user_idx   on public.appointment_bookings(user_id) where user_id is not null;

-- updated_at trigger op appointment_types (functie bestaat al uit schema.sql)
drop trigger if exists appointment_types_set_updated_at on public.appointment_types;
create trigger appointment_types_set_updated_at
  before update on public.appointment_types
  for each row execute function public.set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────
alter table public.appointment_types    enable row level security;
alter table public.appointment_bookings enable row level security;

-- appointment_types: iedereen (ook anon) mag ACTIEVE types lezen zodat de
-- publieke boekingspagina werkt; admins lezen alles. Alleen admins beheren.
drop policy if exists appointment_types_select on public.appointment_types;
create policy appointment_types_select on public.appointment_types
  for select using (active = true or public.is_admin());

drop policy if exists appointment_types_modify on public.appointment_types;
create policy appointment_types_modify on public.appointment_types
  for all using (public.is_admin()) with check (public.is_admin());

-- appointment_bookings: iedereen (ook anon) mag een boeking AANMAKEN, maar
-- alleen voor een bestaand, actief type (anti-garbage). Lezen mag alleen de
-- admin (alles) of de ingelogde klant (eigen boekingen). Anon leest niets.
-- Wijzigen/verwijderen: admin.
drop policy if exists appointment_bookings_insert on public.appointment_bookings;
create policy appointment_bookings_insert on public.appointment_bookings
  for insert with check (
    -- anon boekt zonder user_id; een ingelogde gebruiker mag alleen aan zijn
    -- EIGEN id koppelen (geen spoofing van andermans user_id).
    (user_id is null or user_id = auth.uid())
    -- en alleen voor een bestaand, actief type (anti-garbage).
    and exists (
      select 1 from public.appointment_types t
      where t.id = appointment_type_id and t.active = true
    )
  );

drop policy if exists appointment_bookings_select on public.appointment_bookings;
create policy appointment_bookings_select on public.appointment_bookings
  for select using (
    public.is_admin() or (user_id is not null and auth.uid() = user_id)
  );

drop policy if exists appointment_bookings_modify on public.appointment_bookings;
create policy appointment_bookings_modify on public.appointment_bookings
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists appointment_bookings_delete on public.appointment_bookings;
create policy appointment_bookings_delete on public.appointment_bookings
  for delete using (public.is_admin());

-- ── Seed: de twee CTA-afspraaktypen die de app altijd backfillt ─────────────
-- Hierdoor werkt de publieke boekingspagina voor proefadvies/voortgang meteen,
-- óók voordat een admin voor het eerst inlogt (de anon-insert-policy vereist
-- dat het type bestaat én actief is). Stabiele id's → idempotent.
insert into public.appointment_types
  (id, slug, name, description, duration, buffer_after, advance_notice_min, rolling_days, color, location, location_details, active, assigned_admin_ids, created_by)
values
  ('apt_proefadvies', 'proefadvies', 'Gratis kennismaking & uitleg pakketten',
   'Voor ondernemers die nog geen Osago-abonnement hebben. Kort gesprek (20 min) waarin we je vertellen hoe Osago werkt, welk pakket bij jouw situatie past en je vragen beantwoorden. Geen kosten, geen verplichtingen.',
   20, 10, 30, 21, '#00B33C', 'video', 'Microsoft Teams', true, '["a1","a2"]'::jsonb, 'a1'),
  ('apt_voortgang', 'voortgang', 'Voortgangsgesprek met jouw adviseur',
   'Voor klanten met een actief Osago-abonnement. Bespreek de status van jouw verkoop- of waarderingstraject, eventuele blokkades en de volgende stappen met je vaste adviseur.',
   45, 15, 120, 60, '#0F2945', 'video', 'Microsoft Teams', true, '["a1"]'::jsonb, 'a1')
on conflict (id) do nothing;
