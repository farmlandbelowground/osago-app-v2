-- Stripe Identity: per-profile verification state.
-- Docx §5 "Identity verification": data required per user is status,
-- submitted-on, verified-on, and — if Stripe returns them and they may be
-- shown — the name per the document and the document type.
--
-- Status values used by the app (validated by src/features/identity/schema.ts):
--   'not_started' | 'in_review' | 'verified' | 'rejected'
-- Kept as text (not an enum) so we don't need a migration for each Stripe
-- Identity status Stripe may add later.

alter table public.profiles
  add column if not exists stripe_identity_session_id text,
  add column if not exists stripe_identity_status text not null default 'not_started',
  add column if not exists stripe_identity_submitted_at timestamptz,
  add column if not exists stripe_identity_verified_at timestamptz,
  add column if not exists stripe_identity_document_type text,
  add column if not exists stripe_identity_document_name text,
  add column if not exists stripe_identity_last_error text;

create index if not exists profiles_stripe_identity_session_idx
  on public.profiles(stripe_identity_session_id)
  where stripe_identity_session_id is not null;
