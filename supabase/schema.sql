-- ============================================================
-- Osago App — database schema
-- ============================================================
-- Deploy via Supabase SQL Editor of `supabase db push`.
-- Veilig om meerdere keren te draaien (idempotent waar mogelijk).
--
-- Auth: Supabase Auth verzorgt password-hashing, sessies, magic-links.
-- Wij houden alleen "extended profile" velden bij in public.profiles.
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
do $$ begin
  create type user_role as enum ('customer', 'admin', 'admin_user');
exception when duplicate_object then null; end $$;

do $$ begin
  create type invoice_status as enum ('draft', 'open', 'paid', 'overdue', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lead_type as enum ('pipeline', 'manual', 'osago_validated');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lead_stage as enum (
    'new', 'contact_made', 'interest_confirmed',
    'negotiation', 'closing', 'no_interest'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type validation_status as enum ('pending_validation', 'validated');
exception when duplicate_object then null; end $$;

do $$ begin
  create type voucher_type as enum ('percentage', 'fixed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type document_source as enum ('admin', 'self-generated');
exception when duplicate_object then null; end $$;

-- ============================================================
-- profiles — extended auth.users
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  company text,
  phone text,
  photo text,
  role user_role not null default 'customer',
  onboarding_seen boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_email_idx on public.profiles(email);

-- ============================================================
-- subscriptions
-- ============================================================
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  type text,
  price numeric(10,2),
  list_price numeric(10,2),
  voucher_code text,
  voucher_id uuid,
  start_date date,
  end_date date,
  auto_renew boolean not null default true,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- companies — one row per customer
-- ============================================================
create table if not exists public.companies (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  sector text,
  kvk_nummer text,
  vestigingsnummer text,
  legal_form text,
  kvk_prefilled jsonb not null default '[]'::jsonb,
  auto_forecast boolean not null default true,
  cash_position numeric(15,2),
  independent_assets numeric(15,2),
  long_term_debt numeric(15,2),
  valuation_band numeric(15,2),
  assigned_advisor uuid references auth.users(id),
  logo text,
  dcf_params jsonb not null default '{}'::jsonb,
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists companies_advisor_idx on public.companies(assigned_advisor);
create index if not exists companies_kvk_idx on public.companies(kvk_nummer);

-- ============================================================
-- financials — per year per company
-- ============================================================
create table if not exists public.financials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year int not null,
  revenue numeric(15,2),
  cogs numeric(15,2),
  operating_expenses numeric(15,2),
  depreciation numeric(15,2),
  interest numeric(15,2),
  taxes_paid numeric(15,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year)
);

create index if not exists financials_user_year_idx on public.financials(user_id, year desc);

-- ============================================================
-- valuations — current valuation result
-- ============================================================
create table if not exists public.valuations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  result jsonb not null default '{}'::jsonb,
  dcf_params jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- presentations — last-generated timestamp per customer
-- ============================================================
create table if not exists public.presentations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  generated_at timestamptz not null default now()
);

-- ============================================================
-- leads — unified table for pipeline + manual + osago_validated
-- ============================================================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_type lead_type not null,
  stage lead_stage default 'new',

  -- basic info
  name text,
  type text,
  fit_score numeric(4,2),

  -- contact
  contact_first_name text,
  contact_last_name text,
  contact_email text,
  contact_phone text,
  contact_legacy text,

  -- address
  street text,
  house_number text,
  house_number_addition text,
  postal_code text,
  city text,
  country text,
  location text,

  -- meta
  notes text,
  added_at timestamptz not null default now(),

  -- Osago-validatie
  validated_by_osago boolean not null default false,
  validated_by uuid references auth.users(id),
  validated_at timestamptz,
  added_manually boolean not null default false,

  -- Manual lead validatie-betaalflow
  validation_status validation_status,
  validation_paid_at timestamptz,
  validation_fee numeric(10,2),

  -- Promotion audit-trail
  promoted_to_pipeline boolean not null default false,
  promoted_at timestamptz,
  promoted_from_manual_at timestamptz,
  promoted_from_osago_lead_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_user_type_idx on public.leads(user_id, lead_type);
create index if not exists leads_user_stage_idx on public.leads(user_id, stage) where lead_type = 'pipeline';

-- ============================================================
-- invoices
-- ============================================================
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  number text not null,
  issued_at timestamptz not null default now(),
  due_at timestamptz,
  description text,
  amount numeric(15,2) not null default 0,
  list_amount numeric(15,2),
  discount numeric(15,2),
  voucher_code text,
  voucher_id uuid,
  status invoice_status not null default 'draft',
  paid_at timestamptz,
  paid_by uuid references auth.users(id),
  paid_method text,
  mollie_payment_id text,
  mollie_checkout_url text,
  mollie_payment_status text,
  related_lead_id uuid references public.leads(id) on delete set null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_user_idx on public.invoices(user_id);
create index if not exists invoices_status_idx on public.invoices(status);
create index if not exists invoices_mollie_idx on public.invoices(mollie_payment_id) where mollie_payment_id is not null;
create unique index if not exists invoices_number_unique on public.invoices(number);

-- ============================================================
-- invoice_line_items
-- ============================================================
create table if not exists public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  amount numeric(15,2) not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists line_items_invoice_idx on public.invoice_line_items(invoice_id, sort_order);

-- ============================================================
-- vouchers
-- ============================================================
create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type voucher_type not null,
  value numeric(10,2) not null,
  description text,
  valid_from timestamptz,
  valid_until timestamptz,
  max_uses int,
  used_count int not null default 0,
  active boolean not null default true,
  applies_to text not null default 'all',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create index if not exists vouchers_code_idx on public.vouchers(code);
create index if not exists vouchers_active_idx on public.vouchers(active) where active = true;

-- ============================================================
-- documents — metadata; files in Storage bucket 'osago-documents'
-- ============================================================
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  file_size bigint,
  file_path text,
  description text,
  source document_source not null,
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references auth.users(id)
);

create index if not exists documents_user_idx on public.documents(user_id);
create index if not exists documents_source_idx on public.documents(user_id, source);

-- ============================================================
-- updated_at trigger function
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  for t in
    select unnest(array[
      'profiles','subscriptions','companies','financials',
      'valuations','leads','invoices','vouchers'
    ])
  loop
    execute format($f$
      drop trigger if exists %I_set_updated_at on public.%I;
      create trigger %I_set_updated_at
        before update on public.%I
        for each row execute function public.set_updated_at();
    $f$, t, t, t, t);
  end loop;
end $$;

-- ============================================================
-- Auto-create profile on new auth.users signup
-- ============================================================
-- Note: explicit search_path is critical voor SECURITY DEFINER functies —
-- zonder dit faalt de cast naar public.user_role wanneer de trigger uit
-- de auth-schema-context wordt aangeroepen ("Database error creating new user").
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public, auth as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(
      (new.raw_user_meta_data->>'role')::public.user_role,
      'customer'::public.user_role
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Helper functies voor RLS
-- ============================================================
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'admin_user')
  );
$$;

create or replace function public.is_full_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles            enable row level security;
alter table public.subscriptions       enable row level security;
alter table public.companies           enable row level security;
alter table public.financials          enable row level security;
alter table public.valuations          enable row level security;
alter table public.presentations       enable row level security;
alter table public.leads               enable row level security;
alter table public.invoices            enable row level security;
alter table public.invoice_line_items  enable row level security;
alter table public.vouchers            enable row level security;
alter table public.documents           enable row level security;

-- ============================================================
-- RLS — profiles
-- ============================================================
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete using (public.is_full_admin());

-- ============================================================
-- RLS — generic "owner-or-admin" pattern voor user_id-tabellen
-- ============================================================
do $$
declare t text;
begin
  for t in
    select unnest(array[
      'subscriptions','companies','financials','valuations',
      'presentations','leads','invoices','documents'
    ])
  loop
    execute format($f$
      drop policy if exists %I_select on public.%I;
      create policy %I_select on public.%I
        for select using (auth.uid() = user_id or public.is_admin());

      drop policy if exists %I_insert on public.%I;
      create policy %I_insert on public.%I
        for insert with check (auth.uid() = user_id or public.is_admin());

      drop policy if exists %I_update on public.%I;
      create policy %I_update on public.%I
        for update using (auth.uid() = user_id or public.is_admin());

      drop policy if exists %I_delete on public.%I;
      create policy %I_delete on public.%I
        for delete using (auth.uid() = user_id or public.is_admin());
    $f$, t, t, t, t, t, t, t, t, t, t, t, t, t, t, t, t);
  end loop;
end $$;

-- ============================================================
-- RLS — invoice_line_items (via invoice ownership)
-- ============================================================
drop policy if exists line_items_select on public.invoice_line_items;
create policy line_items_select on public.invoice_line_items
  for select using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and (i.user_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists line_items_modify on public.invoice_line_items;
create policy line_items_modify on public.invoice_line_items
  for all using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and (i.user_id = auth.uid() or public.is_admin())
    )
  ) with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and (i.user_id = auth.uid() or public.is_admin())
    )
  );

-- ============================================================
-- RLS — vouchers (klant: alleen lezen actieve; admin: alles)
-- ============================================================
drop policy if exists vouchers_select on public.vouchers;
create policy vouchers_select on public.vouchers
  for select using (active = true or public.is_admin());

drop policy if exists vouchers_modify on public.vouchers;
create policy vouchers_modify on public.vouchers
  for all using (public.is_full_admin())
  with check (public.is_full_admin());

-- ============================================================
-- Storage bucket: aanmaken via dashboard of CLI
-- ============================================================
-- Bucket: osago-documents
-- Public:  false (alleen via signed URLs)
-- Pad-conventie: <user_id>/<document_id>.<ext>
--
-- Policies (toe te voegen onder Storage > Policies):
--
-- create policy "Own docs select" on storage.objects for select
--   using (bucket_id = 'osago-documents'
--     and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin()));
-- create policy "Own docs insert" on storage.objects for insert
--   with check (bucket_id = 'osago-documents'
--     and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin()));
-- create policy "Own docs update" on storage.objects for update
--   using (bucket_id = 'osago-documents'
--     and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin()));
-- create policy "Own docs delete" on storage.objects for delete
--   using (bucket_id = 'osago-documents'
--     and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin()));
