-- Add owner_user_id to sms_history to track who sent each SMS
-- Add as nullable first (no default to avoid slow update)
alter table public.sms_history
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

-- Create index (run this separately if you get a timeout)
-- Skip the index for now if the table is large - it will still work, just slower queries
-- You can create it later manually when needed:
-- CREATE INDEX sms_history_owner_user_id_idx ON public.sms_history(owner_user_id);
-- For now, we'll skip the index to avoid timeouts

-- Update RLS: Admins see only their own messages, superadmins see all
drop policy if exists "History readable by authenticated" on public.sms_history;
drop policy if exists "History readable by owner" on public.sms_history;
create policy "History readable by owner" on public.sms_history
  for select using (
    owner_user_id = auth.uid() OR
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'superadmin'
    )
  );

-- Allow delete for scheduled_sms (owner or superadmin)
drop policy if exists "scheduled delete by owner" on public.scheduled_sms;
create policy "scheduled delete by owner" on public.scheduled_sms
  for delete using (
    owner_user_id = auth.uid() OR
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'superadmin'
    )
  );

