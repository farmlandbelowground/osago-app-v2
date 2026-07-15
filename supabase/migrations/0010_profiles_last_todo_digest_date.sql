-- ============================================================
-- 0010 — profiles.last_todo_digest_date (idempotency voor daily-todo-digest)
-- ============================================================
-- De daily-todo-digest cron mist als enige van de vier cron-mails een
-- dedupe-marker. Bij een Vercel-redeploy of double-fire kan de digest dus
-- dubbel bij elke klant landen. De andere crons (subscription-ending,
-- expired-followup, no-sub-followup) gebruiken al kolommen op subscriptions
-- / profiles voor idempotency; deze migratie brengt daily-todo-digest op
-- gelijk niveau.
--
-- Één date-kolom volstaat: we sturen de digest maximaal 1x per dag per klant.
-- Idempotent.
-- ============================================================

alter table public.profiles
  add column if not exists last_todo_digest_date date;

comment on column public.profiles.last_todo_digest_date is
  'Datum waarop de laatste daily_todo_digest-mail aan deze klant is verstuurd. Gebruikt door api/cron/daily-todo-digest.js om dubbele sends te voorkomen bij redeploy / double-fire van Vercel-cron.';
