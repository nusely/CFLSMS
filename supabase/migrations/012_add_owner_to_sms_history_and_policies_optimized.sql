-- OPTIMIZED VERSION: Run in steps if you get timeouts
-- Step 1: Add column (nullable, no default = fast)
alter table public.sms_history
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

-- Step 2: Create index (may timeout on large tables - run separately)
-- If this times out, run manually in Supabase SQL Editor:
-- create index concurrently sms_history_owner_user_id_idx on public.sms_history(owner_user_id);
create index if not exists sms_history_owner_user_id_idx on public.sms_history(owner_user_id);

-- Step 3: Update RLS policies
drop policy if exists "History readable by authenticated" on public.sms_history;
create policy "History readable by owner" on public.sms_history
  for select using (
    owner_user_id = auth.uid() OR
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'superadmin'
    )
  );

-- Step 4: Allow delete for scheduled_sms (owner or superadmin)
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

