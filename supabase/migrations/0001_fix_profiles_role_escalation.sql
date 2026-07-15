-- ============================================================
-- 0001 — Fix profiles role self-escalation
-- ============================================================
-- Problem: the profiles UPDATE policy is
--   using ((auth.uid() = id) OR is_admin())   with WITH CHECK = NULL,
-- so a logged-in customer can update their OWN row and set role = 'admin',
-- gaining full access to every table via is_admin().
--
-- RLS WITH CHECK cannot compare the old row to the new row, so we enforce
-- the invariant with a BEFORE UPDATE trigger instead: `role` may only change
-- when the caller is a full admin. All other column updates (name, phone,
-- onboarding flags, ...) keep working for the row owner. INSERTs are
-- unaffected (trigger is UPDATE-only), so signup / handle_new_user keep
-- working. Safe to run multiple times.
-- ============================================================

create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_full_admin() then
    raise exception 'Changing role is not allowed.'
      using errcode = '42501';  -- insufficient_privilege
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_no_role_escalation on public.profiles;
create trigger profiles_no_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_change();
