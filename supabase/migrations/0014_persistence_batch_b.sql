-- ============================================================
-- 0014 — persistence batch B (kolommen + projects-tabel)
-- ============================================================
-- Uit de false-success/persistence-audit. Idempotent.
-- ============================================================

-- profiles: medewerker actief-vlag, klant-ID (K-code), adviseur-beschikbaarheid
alter table public.profiles
  add column if not exists active       boolean not null default true,
  add column if not exists customer_id  text,
  add column if not exists availability jsonb;

-- financials: per-jaar weging van historische jaren (0..5) — beïnvloedt de
-- waardering; had geen kolom en viel buiten de companies.extra fallback.
alter table public.financials
  add column if not exists history_weight int;

-- ── projects (dossiernummers P00000x) — per user ────────────
create table if not exists public.projects (
  id         text primary key,
  project_id text,
  user_id    uuid references auth.users(id) on delete cascade,
  type       text,
  created_at timestamptz not null default now()
);
create index if not exists projects_user_idx on public.projects(user_id);

alter table public.projects enable row level security;

drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists projects_modify on public.projects;
create policy projects_modify on public.projects
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());
