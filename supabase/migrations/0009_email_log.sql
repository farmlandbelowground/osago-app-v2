-- ============================================================
-- 0009 — email_log (persistent audit-trail voor server-side mails)
-- ============================================================
-- Tot nu toe leeft `db.emailLog` alleen client-side (in de bundle-runtime).
-- Server-side triggers — Mollie-webhooks, cron-jobs, password-reset — laten
-- géén spoor achter behalve wat er in de Vercel-console-logs staat. Gevolg:
--   - een mislukte verzending is achteraf niet terugvindbaar per klant/case;
--   - "is die welkomst-mail wel uitgegaan?" kan niet zonder terminal-scroll;
--   - retries + Idempotency-Key laten niet zien hoeveel pogingen nodig waren.
--
-- Deze tabel logt élke server-side attempt (success, failed, skipped,
-- simulated). Client-side triggers blijven vooralsnog in `db.emailLog` —
-- die kunnen in een vervolg-PR hierheen migreren via de eigen /api/email/send
-- proxy. Idempotent.
-- ============================================================

create table if not exists public.email_log (
  id                  uuid primary key default gen_random_uuid(),
  template_id         text,
  subject             text not null,
  from_name           text not null default 'Osago',
  from_email          text not null default 'support@osago.nl',
  to_addresses        text[] not null,
  bcc_addresses       text[],
  status              text not null check (status in ('sent','failed','skipped','simulated')),
  skip_reason         text,
  provider            text,
  provider_message_id text,
  provider_error      text,
  attempts            integer not null default 0,
  context             text,
  related             jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

-- ── Indexes ─────────────────────────────────────────────────
-- Admin-UI zal filteren op chronologie, status en context (bv. alle failed
-- van cron.subscription-ending in de laatste week). Template-filter voor
-- "hoeveel welkomst-mails deze maand".
create index if not exists email_log_created_idx    on public.email_log (created_at desc);
create index if not exists email_log_status_idx     on public.email_log (status);
create index if not exists email_log_template_idx   on public.email_log (template_id);
create index if not exists email_log_context_idx    on public.email_log (context);

-- ── RLS ─────────────────────────────────────────────────────
alter table public.email_log enable row level security;

-- Alleen volle admins mogen lezen (zelfde lat als app_config write).
drop policy if exists email_log_select on public.email_log;
create policy email_log_select on public.email_log
  for select using (public.is_full_admin());

-- Geen INSERT-policy: alleen service-role schrijft (vanuit _email.js).
-- Service-role bypasses RLS by design, dus geen policy nodig — het ontbreken
-- van een INSERT-policy voor authenticated/anon voorkomt oneigenlijk gebruik
-- vanuit de client-bundle.
