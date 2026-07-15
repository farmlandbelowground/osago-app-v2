-- ============================================================
-- 0005 — app_config (gedeelde admin-instellingen)
-- ============================================================
-- Tot nu toe leefden de admin-instellingen (waarderingsmultiples, DCF-defaults,
-- aftrekken, e-mailtemplates) alleen in localStorage met seed-defaults. Gevolg:
--   - elke browser toonde de seed-waarden i.p.v. de echt ingestelde waarden;
--   - twee admins op verschillende browsers konden uiteenlopende multiples/WACC
--     hebben → klanten kregen afhankelijk van de browser andere waarderingen.
-- Eén gedeelde key/value-tabel lost dat op: één bron van waarheid voor alle
-- admins, en leesbaar voor de DCF-engine (ook voor klanten en anon).
--
-- Keys in gebruik: 'valuationMultiples', 'dcfAdminDefaults',
-- 'smallEbitdaDeductions', 'smallOrgDeductions', 'emailTemplates'.
-- Idempotent.
-- ============================================================

create table if not exists public.app_config (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- updated_at trigger (functie bestaat al uit schema.sql)
drop trigger if exists app_config_set_updated_at on public.app_config;
create trigger app_config_set_updated_at
  before update on public.app_config
  for each row execute function public.set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────
alter table public.app_config enable row level security;

-- Iedereen (ook anon + klanten) mag lezen: de DCF-/waarderings-engine draait
-- ook klant-zijde en heeft de multiples + WACC-componenten nodig.
drop policy if exists app_config_select on public.app_config;
create policy app_config_select on public.app_config
  for select using (true);

-- Alleen volledige admins mogen schrijven (zelfde lat als de voucher-catalogus).
drop policy if exists app_config_modify on public.app_config;
create policy app_config_modify on public.app_config
  for all using (public.is_full_admin()) with check (public.is_full_admin());
