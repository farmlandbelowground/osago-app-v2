-- ============================================================
-- 0012 — ai_usage_daily (rate-limit voor Genereer/Herschrijf AI-calls)
-- ============================================================
-- Genereer/Herschrijf-knoppen op /waarderingsrapport en
-- /verkooppresentatie-uitgebreid roepen /api/anthropic/v1/messages aan.
-- Om onbedoelde kostenpieken te voorkomen: 500 calls per klant per dag
-- (Europe/Amsterdam-kalenderdag). Admins zijn uitgesloten van de cap.
--
-- Teller per (user_id, dag). Atomische increment via RPC
-- public.increment_ai_usage() zodat er geen race-conditions ontstaan
-- tussen parallelle calls. Idempotent.
-- ============================================================

create table if not exists public.ai_usage_daily (
  user_id  uuid not null references auth.users(id) on delete cascade,
  date     date not null,
  count    integer not null default 0,
  primary key (user_id, date)
);

create index if not exists ai_usage_daily_date_idx
  on public.ai_usage_daily (date);

-- RPC-functie voor atomische increment + limit-check. Retourneert:
--   - de nieuwe count bij succes;
--   - -1 wanneer de limiet is overschreden (de teller wordt dan gecorrigeerd
--     zodat 'ie precies op de limiet blijft staan).
-- SECURITY DEFINER: draait als de definer zodat de proxy-endpoint 'em kan
-- aanroepen ook als de aanroeper geen INSERT/UPDATE-rechten heeft op de
-- onderliggende tabel.
create or replace function public.increment_ai_usage(
  p_user_id uuid,
  p_date    date,
  p_limit   integer
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.ai_usage_daily (user_id, date, count)
  values (p_user_id, p_date, 1)
  on conflict (user_id, date)
  do update set count = public.ai_usage_daily.count + 1
  returning count into new_count;

  if new_count > p_limit then
    -- Rollback zodat de teller precies op de limiet blijft staan en
    -- volgende calls in dezelfde dag ook meteen 429 krijgen.
    update public.ai_usage_daily
      set count = count - 1
      where user_id = p_user_id and date = p_date;
    return -1;
  end if;

  return new_count;
end;
$$;

-- ── RLS ─────────────────────────────────────────────────────
alter table public.ai_usage_daily enable row level security;

-- Alleen full admins mogen SELECT (voor eventuele audits/dashboards).
-- INSERT/UPDATE gaat via de RPC of service-role (die bypasst RLS).
drop policy if exists ai_usage_daily_select on public.ai_usage_daily;
create policy ai_usage_daily_select on public.ai_usage_daily
  for select using (public.is_full_admin());
