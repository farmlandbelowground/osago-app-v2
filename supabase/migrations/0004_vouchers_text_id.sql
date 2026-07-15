-- ============================================================
-- 0004 — vouchers.id naar TEXT
-- ============================================================
-- De vouchers-tabel had een uuid-PK met gen_random_uuid()-default, maar de app
-- gebruikt tekst-id's ('vch1' seed, 'vch_<timestamp>' voor nieuwe) die overal
-- als voucherId worden gerefereerd (subscriptions/redemptions). Door de id naar
-- TEXT te zetten kunnen de app-id's 1-op-1 syncen, net als bij de appointment-
-- tabellen.
--
-- Veilig: de tabel is leeg in productie en heeft geen inkomende foreign keys
-- (de toegepaste voucher wordt inline in de subscription bewaard, niet als FK).
-- De RLS-policies (vouchers_select / vouchers_modify) hangen niet van het
-- id-type af en blijven ongewijzigd geldig. Idempotent.
-- ============================================================

alter table public.vouchers alter column id drop default;
alter table public.vouchers alter column id type text using id::text;
