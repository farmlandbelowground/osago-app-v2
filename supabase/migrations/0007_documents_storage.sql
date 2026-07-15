-- ============================================================
-- 0007 — documents naar Supabase Storage
-- ============================================================
-- Documenten (gegenereerde rapporten/IM's + admin-uploads) werden als base64
-- data-URL in localStorage bewaard. Dat is niet duurzaam: de quota-pruning in
-- logSelfGeneratedDocument wist zelfs oude bestanden om ruimte te maken, en de
-- admin zag andermans documenten nooit. Nu: bestand in een privé Storage-bucket,
-- metadata in public.documents.
--
-- Pad-conventie: <user_id>/<document_id>.<ext>
-- Idempotent.
-- ============================================================

-- ── documents.id → TEXT ─────────────────────────────────────
-- De app gebruikt tekst-id's ('doc_...'); de tabel was leeg en heeft geen
-- inkomende FK. Zo syncen de app-id's 1-op-1 (zelfde aanpak als vouchers).
alter table public.documents alter column id drop default;
alter table public.documents alter column id type text using id::text;

-- ── Storage bucket (privé; alleen via signed URLs) ──────────
insert into storage.buckets (id, name, public)
values ('osago-documents', 'osago-documents', false)
on conflict (id) do nothing;

-- ── Storage RLS op storage.objects ──────────────────────────
-- Eerste pad-segment = user_id. Eigenaar (eigen uid) of admin mag lezen/schrijven.
-- Admin-upload voor een klant gebruikt het pad <klant_uid>/...; dat mag via
-- is_admin(). De klant leest 'm later terug omdat het eerste segment z'n eigen
-- uid is.
drop policy if exists osago_docs_select on storage.objects;
create policy osago_docs_select on storage.objects
  for select using (
    bucket_id = 'osago-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists osago_docs_insert on storage.objects;
create policy osago_docs_insert on storage.objects
  for insert with check (
    bucket_id = 'osago-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists osago_docs_update on storage.objects;
create policy osago_docs_update on storage.objects
  for update using (
    bucket_id = 'osago-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists osago_docs_delete on storage.objects;
create policy osago_docs_delete on storage.objects
  for delete using (
    bucket_id = 'osago-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
