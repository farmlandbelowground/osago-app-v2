-- ============================================================
-- 0008 — DCF-kritieke company-velden naar eigen kolommen
-- ============================================================
-- Deze velden reden mee in de companies.extra-JSONB catch-all. Ze persisten
-- daar prima, maar zijn niet queryable/indexeerbaar en vallen buiten schema-
-- discipline. We geven de DCF-bepalende velden eigen kolommen (zie audit #7):
--   - dcf_apply_enabled        : schakelaar DCF vs. EBITDA-multiple-methodiek
--   - last_closed_year         : ankerjaar voor de Financials-tabel + DCF-periode
--   - bedrijf_markt_ontwikkeling: groei-aanname in DCF (0-4)
--   - dcf_new_inputs (jsonb)   : alle DCF-input-overrides (rfr/mrp/sliders/...)
--
-- De client leest kolom-eerst met fallback op extra (backwards-compat). Idempotent.
-- ============================================================

alter table public.companies
  add column if not exists dcf_apply_enabled          boolean,
  add column if not exists last_closed_year           int,
  add column if not exists bedrijf_markt_ontwikkeling  int,
  add column if not exists dcf_new_inputs             jsonb;

-- Backfill uit de bestaande extra-JSONB, alleen waar de kolom nog leeg is en de
-- waarde geldig (guards voorkomen cast-fouten op rommelige waarden).
update public.companies
   set dcf_apply_enabled = (extra->>'dcfApplyEnabled')::boolean
 where dcf_apply_enabled is null and (extra->>'dcfApplyEnabled') in ('true', 'false');

update public.companies
   set last_closed_year = (extra->>'lastClosedYear')::int
 where last_closed_year is null and (extra->>'lastClosedYear') ~ '^-?[0-9]+$';

update public.companies
   set bedrijf_markt_ontwikkeling = (extra->>'bedrijfMarktOntwikkeling')::int
 where bedrijf_markt_ontwikkeling is null and (extra->>'bedrijfMarktOntwikkeling') ~ '^-?[0-9]+$';

update public.companies
   set dcf_new_inputs = (extra->'dcfNewInputs')
 where dcf_new_inputs is null and jsonb_typeof(extra->'dcfNewInputs') = 'object';
