-- Create basic profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  role text not null default 'admin',
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users" on public.profiles for select using (auth.role() = 'authenticated');

-- Optional: sync on signup via trigger could be added later

