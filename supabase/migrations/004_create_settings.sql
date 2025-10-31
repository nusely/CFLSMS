create table if not exists public.settings (
  id bigserial primary key,
  key text unique not null,
  value jsonb not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.settings enable row level security;
create policy "Settings readable by superadmin" on public.settings for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));
create policy "Settings write by superadmin" on public.settings for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

