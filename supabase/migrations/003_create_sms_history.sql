create table if not exists public.sms_history (
  id bigserial primary key,
  recipient text not null,
  message text not null,
  status text not null,
  provider_response jsonb,
  created_at timestamp with time zone default now()
);

alter table public.sms_history enable row level security;
create policy "History readable by authenticated" on public.sms_history for select using (auth.role() = 'authenticated');

