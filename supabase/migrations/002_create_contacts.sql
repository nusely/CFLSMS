create table if not exists public.contacts (
  id bigserial primary key,
  name text,
  phone text not null unique,
  groups text[],
  created_at timestamp with time zone default now()
);

alter table public.contacts enable row level security;

create policy "Contacts readable by authenticated" on public.contacts for select using (auth.role() = 'authenticated');
create policy "Contacts insert by authenticated" on public.contacts for insert with check (auth.role() = 'authenticated');
create policy "Contacts update by authenticated" on public.contacts for update using (auth.role() = 'authenticated');
create policy "Contacts delete by authenticated" on public.contacts for delete using (auth.role() = 'authenticated');

