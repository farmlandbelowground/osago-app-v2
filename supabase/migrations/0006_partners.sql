-- ============================================================
-- 0006 — partners (publieke introductie-/registratielinks)
-- ============================================================
-- Partners (boekhouders, brancheverenigingen, samenwerkingspartijen) verwijzen
-- klanten naar Osago via een eigen, brandbare registratielink
-- (/partner/<slug> of #partner/<slug>). Tot nu toe leefden partners alleen in
-- localStorage, dus een link werkte alleen voor wie de partner toevallig in zijn
-- eigen browser had — externe bezoekers zagen niets. Zelfde patroon als de
-- appointment-tabellen: tekst-id's (de app gebruikt 'prt_...'), publieke lees-
-- toegang op actieve partners zodat de registratiepagina ook zonder login werkt.
--
-- voucher_id is bewust GEEN harde FK naar vouchers: de sync-volgorde kan
-- verschillen en de app resolved de voucher lokaal op id. Idempotent.
-- ============================================================

create table if not exists public.partners (
  id             text primary key,
  slug           text not null unique,
  name           text not null,
  description    text,
  logo           text,
  voucher_id     text,
  contact_person text,
  contact_email  text,
  contact_phone  text,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  created_by     text,
  updated_at     timestamptz not null default now()
);

create index if not exists partners_slug_idx   on public.partners(slug);
create index if not exists partners_active_idx on public.partners(active) where active = true;

-- updated_at trigger (functie bestaat al uit schema.sql)
drop trigger if exists partners_set_updated_at on public.partners;
create trigger partners_set_updated_at
  before update on public.partners
  for each row execute function public.set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────
alter table public.partners enable row level security;

-- Iedereen (ook anon) mag ACTIEVE partners lezen → de publieke
-- /partner/<slug>-registratiepagina werkt zonder login. Admins lezen alles.
drop policy if exists partners_select on public.partners;
create policy partners_select on public.partners
  for select using (active = true or public.is_admin());

-- Alleen volledige admins beheren partners.
drop policy if exists partners_modify on public.partners;
create policy partners_modify on public.partners
  for all using (public.is_full_admin()) with check (public.is_full_admin());
