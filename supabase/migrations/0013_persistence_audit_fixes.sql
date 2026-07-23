-- ============================================================
-- 0013 — persistence-audit fixes (decision-free batch)
-- ============================================================
-- Kolommen + RLS + RPC voor gaten uit de round-trip-audit. Idempotent.
-- NB: reminder_24h/1h_sent_at op appointment_bookings zitten al in migratie
-- 0011 (server-cron aanpak) — bewust NIET hier.
-- ============================================================

-- ── profiles: partner-referral attributie ──────────────────
alter table public.profiles
  add column if not exists referred_by_partner_id text,
  add column if not exists partner_voucher_code   text;

-- ── leads: velden die in geen kolom pasten ──────────────────
alter table public.leads
  add column if not exists auto_source_website text,
  add column if not exists sector              text;

-- ── RLS: klant mag zijn EIGEN boeking bijwerken (self-cancel) ─
-- appointment_bookings_modify (0003) is admin-only. Deze extra policy laat een
-- ingelogde klant alleen zijn eigen boeking (user_id = auth.uid()) bijwerken.
drop policy if exists appointment_bookings_owner_update on public.appointment_bookings;
create policy appointment_bookings_owner_update on public.appointment_bookings
  for update
  using (user_id is not null and auth.uid() = user_id)
  with check (user_id is not null and auth.uid() = user_id);

-- ── Voucher-gebruik veilig ophogen ──────────────────────────
-- Klanten mogen vouchers NIET direct schrijven (RLS = full-admin only). Deze
-- SECURITY DEFINER-functie doet ALLEEN de increment voor een actieve code.
create or replace function public.increment_voucher_usage(p_code text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.vouchers
     set used_count = coalesce(used_count, 0) + 1
   where upper(code) = upper(p_code) and active = true;
$$;
revoke all on function public.increment_voucher_usage(text) from public;
grant execute on function public.increment_voucher_usage(text) to authenticated;
