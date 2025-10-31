create table if not exists public.scheduled_sms (
  id bigserial primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  recipient text not null,
  message text not null,
  scheduled_at timestamptz not null,
  status text not null default 'pending', -- pending|sent|failed
  attempts int not null default 0,
  last_error text,
  created_at timestamptz default now()
);

-- E.164 check on recipient (8-15 digits, not starting with 0)
alter table public.scheduled_sms
  drop constraint if exists scheduled_sms_recipient_e164_chk,
  add constraint scheduled_sms_recipient_e164_chk check (recipient ~ '^[1-9][0-9]{7,14}$');

alter table public.scheduled_sms enable row level security;

-- RLS: owners can see/insert their own rows
create policy "scheduled select by owner" on public.scheduled_sms for select using (owner_user_id = auth.uid());
create policy "scheduled insert by owner" on public.scheduled_sms for insert with check (owner_user_id = auth.uid());
-- Allow owner to update only while pending
create policy "scheduled update pending by owner" on public.scheduled_sms for update using (owner_user_id = auth.uid() and status = 'pending') with check (owner_user_id = auth.uid());

