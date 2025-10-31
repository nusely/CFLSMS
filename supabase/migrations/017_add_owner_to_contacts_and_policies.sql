-- Add owner_user_id to contacts to track who added each contact
alter table public.contacts
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

-- Create index for faster lookups
create index if not exists contacts_owner_user_id_idx on public.contacts(owner_user_id);

-- Update RLS policies for contacts
drop policy if exists "Contacts readable by authenticated" on public.contacts;
drop policy if exists "Contacts insert by authenticated" on public.contacts;
drop policy if exists "Contacts update by authenticated" on public.contacts;
drop policy if exists "Contacts delete by authenticated" on public.contacts;

-- All authenticated users can see all contacts
create policy "Contacts readable by authenticated" on public.contacts 
  for select using (auth.role() = 'authenticated');

-- Only owner or superadmin can delete contacts
create policy "Contacts delete by owner or superadmin" on public.contacts 
  for delete using (
    owner_user_id = auth.uid() OR
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'superadmin'
    )
  );

-- All authenticated users can insert and update contacts
create policy "Contacts insert by authenticated" on public.contacts 
  for insert with check (auth.role() = 'authenticated');

create policy "Contacts update by authenticated" on public.contacts 
  for update using (auth.role() = 'authenticated');

