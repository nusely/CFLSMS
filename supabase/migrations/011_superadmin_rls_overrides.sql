-- Allow superadmin to view/modify all contact lists and memberships
drop policy if exists "lists select by superadmin" on public.contact_lists;
create policy "lists select by superadmin" on public.contact_lists
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
  );

drop policy if exists "lists modify by superadmin" on public.contact_lists;
create policy "lists modify by superadmin" on public.contact_lists
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
  );

drop policy if exists "members select by superadmin" on public.contact_list_members;
create policy "members select by superadmin" on public.contact_list_members
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
  );

drop policy if exists "members modify by superadmin" on public.contact_list_members;
create policy "members modify by superadmin" on public.contact_list_members
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
  );

-- Allow superadmin to view all scheduled_sms across owners
drop policy if exists "scheduled select by superadmin" on public.scheduled_sms;
create policy "scheduled select by superadmin" on public.scheduled_sms
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
  );

drop policy if exists "scheduled modify by superadmin" on public.scheduled_sms;
create policy "scheduled modify by superadmin" on public.scheduled_sms
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
  );


