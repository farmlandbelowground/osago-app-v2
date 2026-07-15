# Mollie Sales Invoicing — Setup

Deze folder bevat de server-endpoints voor de Mollie Sales Invoicing-integratie
(Fase A + B + C). Voordat de code live kan, moet er in Supabase een SQL-migratie
draaien en moeten er env-vars in Vercel gezet worden.

## 1. Supabase-migratie

Open Supabase → SQL Editor en run onderstaande migratie **eenmalig**:

```sql
-- ============================================================
-- Mollie Sales Invoicing — schema + historische opruiming
-- ============================================================

-- 1a. Pending activations (abo's): koppeling tussen een Mollie sales-invoice-id
--     en het bijbehorende abonnement. Wordt bij aanmaken van de factuur gevuld
--     (create.js of cron) en na 'paid'-webhook door de webhook opgeruimd.
create table if not exists public.mollie_pending_activations (
  sales_invoice_id text primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  plan_id          text not null,
  price_net        numeric not null,
  list_price_net   numeric not null,
  voucher_id       uuid,
  voucher_code     text,
  created_by       uuid,             -- caller die de factuur aanmaakte (self vs admin)
  source           text,             -- 'self-service' | 'admin' | 'cron'
  created_at       timestamptz not null default now()
);
alter table public.mollie_pending_activations enable row level security;

-- 1b. Pending lead-validaties: koppeling voor Mollie-facturen die horen bij
--     een validatie-fee voor een handmatig ingediende lead.
create table if not exists public.mollie_pending_lead_validations (
  sales_invoice_id text primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  lead_id          uuid not null,
  fee              numeric not null,
  created_at       timestamptz not null default now()
);
alter table public.mollie_pending_lead_validations enable row level security;

-- 1c. Subscription billing periods: idempotency-tabel voor de cron.
--     Per (user_id, period_start) mag er maar één factuur zijn — zo
--     voorkomt de dagelijkse cron dubbele verlengings-facturen.
create table if not exists public.subscription_billing_periods (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  period_start     date not null,
  period_end       date not null,
  sales_invoice_id text not null,
  created_at       timestamptz not null default now(),
  unique (user_id, period_start)
);
alter table public.subscription_billing_periods enable row level security;

-- 1d. Pending subscriptions (Payments-based flow, sinds juli 2026):
--     de klant-abo-aankoop loopt nu via Mollie Payments i.p.v. Sales
--     Invoicing, zodat de klant na betaling via redirectUrl automatisch
--     terugkomt. Deze tabel koppelt Mollie's payment-id aan het te
--     activeren abo; wordt opgeruimd zodra de webhook of het return-
--     endpoint 't heeft geactiveerd.
create table if not exists public.mollie_pending_subscriptions (
  mollie_payment_id text primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  plan_id          text not null,
  price_net        numeric not null,
  list_price_net   numeric not null,
  voucher_id       uuid,
  voucher_code     text,
  created_at       timestamptz not null default now()
);
alter table public.mollie_pending_subscriptions enable row level security;
-- Geen policies — alleen de Vercel service-role heeft toegang tot deze
-- vier tabellen. Klant/admin lezen ze nooit rechtstreeks.

-- 2. RPC om voucher.used_count atomair te verhogen. De webhook roept deze
--    aan zodra een abo met voucher geactiveerd wordt. Idempotent voor
--    parallelle webhook-hits dankzij row-level lock.
create or replace function public.increment_voucher_usage(voucher_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.vouchers
     set used_count = coalesce(used_count, 0) + 1
   where id = voucher_id;
end;
$$;
revoke all on function public.increment_voucher_usage(uuid) from public;
grant execute on function public.increment_voucher_usage(uuid) to service_role;

-- 3. Historische facturen weggooien (klant-keuze bij deze migratie).
--    Uitcommenteren als je ze toch wilt behouden.
delete from public.invoice_line_items;
delete from public.invoices;
```

## 2. Vercel env-vars

Zet in Vercel → Project → Settings → Environment Variables (Production +
Preview):

| Naam | Waarde | Verplicht? |
|---|---|---|
| `MOLLIE_API_KEY` | `live_...` (of `test_...`) uit Mollie Dashboard | ✅ |
| `APP_URL` | `https://<jouw-productie-domein>` | ✅ (voor webhook-URL) |
| `CRON_SECRET` | Willekeurige string (bv. `openssl rand -hex 32`) | ✅ (Fase C) |
| `SUPABASE_URL` | Bestaat al | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Bestaat al | ✅ |

**Fallback**: als `APP_URL` niet gezet is, valt de code terug op
`https://${VERCEL_URL}` (auto-populated door Vercel). Voor Production is
`APP_URL` sowieso aan te raden — die is stabiel per omgeving.

**Vercel Cron vereist een Pro-plan**. Zonder Pro wordt de cron simpelweg
niet uitgevoerd; de endpoint zelf is dan wel bereikbaar (bv. handmatig te
triggeren via `curl -H "Authorization: Bearer $CRON_SECRET" https://<APP_URL>/api/cron/monthly-invoices`).

## 3. Mollie-dashboard checks

- Invoicing is aan (Mollie → Invoicing).
- Organisatie-/bedrijfsgegevens compleet (adres, KvK, BTW) — zonder deze
  weigert Mollie live-invoices.
- Sender-domain voor invoicing e-mails is geverifieerd.

## 4. Endpoints

| Route | Methode | Auth | Doel |
|---|---|---|---|
| `/api/mollie/sales-invoice/create` | POST | User (manual = admin) | Sales invoice aanmaken. Modes: `subscription` / `manual` / `lead_validation`. |
| `/api/mollie/sales-invoice/list` | GET | User (`?email=` en `?all=1` = admin) | Facturen ophalen, verrijkt met paymentUrl+pdfUrl. |
| `/api/mollie/sales-invoice/webhook` | POST | Publiek | Mollie webhook — activeert abo of lead-validatie bij 'paid'. |
| `/api/mollie/sales-invoice/delete` | DELETE | Admin | Draft-factuur verwijderen. |
| `/api/cron/monthly-invoices` | GET/POST | `Authorization: Bearer $CRON_SECRET` | Dagelijkse cron voor recurring facturen. |

## 5. Cron-flow

De cron draait dagelijks om 07:00 UTC (`0 7 * * *`) en:

1. Zoekt subscriptions met `auto_renew=true` waarvan `end_date` binnen 14 dagen valt.
2. Voor elke sub: check `subscription_billing_periods` op de volgende periode.
   Bestaat er al een row voor `(user_id, next_period_start)` → skip.
3. Maakt bij Mollie een sales invoice voor de volgende termijn (6 maanden).
4. Registreert `subscription_billing_periods` + `mollie_pending_activations`.
5. Retourneert `{ total, created, skipped, errors[] }` als JSON — bruikbaar
   voor monitoring.

De webhook activeert het verlengde abo pas zodra de klant betaalt. Onbetaalde
facturen blijven "issued" tot ze verlopen; Mollie's eigen herinnerings-mails
sporen de klant aan.
