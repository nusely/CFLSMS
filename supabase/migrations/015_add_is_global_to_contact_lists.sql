-- Add is_global column to contact_lists
alter table public.contact_lists 
add column if not exists is_global boolean default false not null;

-- Update RLS policies to support global groups
-- Drop existing policies first
drop policy if exists "lists select by owner" on public.contact_lists;
drop policy if exists "lists modify by owner" on public.contact_lists;

-- Superadmins can see all groups (their own + admins' groups + global groups)
create policy "lists select by superadmin or global or owner" on public.contact_lists 
for select using (
  -- Superadmin can see all groups
  exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() and p.role = 'superadmin'
  )
  OR
  -- Admins can see global groups
  (
    is_global = true
    AND exists (
      select 1 from public.profiles p 
      where p.id = contact_lists.owner_user_id and p.role = 'superadmin'
    )
  )
  OR
  -- Users can see their own groups
  owner_user_id = auth.uid()
);

-- Only superadmins can create/update global groups
-- Admins can only create non-global groups
-- Users can modify their own groups (but can't make them global)
create policy "lists modify by owner with restrictions" on public.contact_lists 
for all using (
  owner_user_id = auth.uid()
  OR
  exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() and p.role = 'superadmin'
  )
) with check (
  (
    -- Superadmin can do anything
    exists (
      select 1 from public.profiles p 
      where p.id = auth.uid() and p.role = 'superadmin'
    )
  )
  OR
  (
    -- Admin can only create/modify their own non-global groups
    owner_user_id = auth.uid()
    AND is_global = false
  )
);

-- Update member policies to allow admins to access global groups
drop policy if exists "members select by owner" on public.contact_list_members;
drop policy if exists "members modify by owner" on public.contact_list_members;

-- Members: Superadmins can see all, Admins can see global + their own
create policy "members select by superadmin or global or owner" on public.contact_list_members 
for select using (
  -- Superadmin can see all memberships
  exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() and p.role = 'superadmin'
  )
  OR
  -- Users can see memberships in their own groups
  exists (
    select 1 from public.contact_lists l 
    where l.id = contact_list_members.list_id 
    and l.owner_user_id = auth.uid()
  )
  OR
  -- Admins can see memberships in global groups
  exists (
    select 1 from public.contact_lists l 
    where l.id = contact_list_members.list_id 
    and l.is_global = true
    and exists (
      select 1 from public.profiles p 
      where p.id = l.owner_user_id and p.role = 'superadmin'
    )
  )
);

-- Members: Only superadmins can modify global groups, users can modify their own
create policy "members modify by superadmin or owner" on public.contact_list_members 
for all using (
  -- Superadmin can modify all memberships
  exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() and p.role = 'superadmin'
  )
  OR
  -- Users can modify memberships in their own groups
  exists (
    select 1 from public.contact_lists l 
    where l.id = contact_list_members.list_id 
    and l.owner_user_id = auth.uid()
  )
) with check (
  -- Same conditions for insert/update
  exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() and p.role = 'superadmin'
  )
  OR
  exists (
    select 1 from public.contact_lists l 
    where l.id = contact_list_members.list_id 
    and l.owner_user_id = auth.uid()
  )
);

