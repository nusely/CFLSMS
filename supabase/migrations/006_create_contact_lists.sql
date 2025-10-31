-- Contact lists owned by an admin (auth.uid)
create table if not exists public.contact_lists (
  id bigserial primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.contact_list_members (
  list_id bigint not null references public.contact_lists(id) on delete cascade,
  contact_id bigint not null references public.contacts(id) on delete cascade,
  added_at timestamptz default now(),
  primary key (list_id, contact_id)
);

alter table public.contact_lists enable row level security;
alter table public.contact_list_members enable row level security;

-- Policies: only owners can read/write their lists and memberships
create policy "lists select by owner" on public.contact_lists for select using (owner_user_id = auth.uid());
create policy "lists modify by owner" on public.contact_lists for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

create policy "members select by owner" on public.contact_list_members for select using (
  exists (select 1 from public.contact_lists l where l.id = contact_list_members.list_id and l.owner_user_id = auth.uid())
);
create policy "members modify by owner" on public.contact_list_members for all using (
  exists (select 1 from public.contact_lists l where l.id = contact_list_members.list_id and l.owner_user_id = auth.uid())
) with check (
  exists (select 1 from public.contact_lists l where l.id = contact_list_members.list_id and l.owner_user_id = auth.uid())
);

