-- Migratie 0002 — ondersteuning voor automatisch geïdentificeerde leads
-- (Kopersmatching → "Automatisch geïdentificeerde leads").
--
-- 1. Nieuwe lead_type enum-waarde 'auto_identified'.
-- 2. Twee nullable kolommen op public.leads voor auto-lead-specifieke data:
--      website  — URL van de gevonden koper (indien bekend)
--      source   — herkomst-marker ('auto' voor web-geïdentificeerde leads)
--
-- Non-destructief: bestaande rijen en types blijven ongewijzigd.
-- LET OP: ALTER TYPE ... ADD VALUE moet buiten een transactieblok draaien,
-- daarom staat de enum-uitbreiding als losse statement bovenaan.

alter type lead_type add value if not exists 'auto_identified';

alter table public.leads add column if not exists website text;
alter table public.leads add column if not exists source text;
