alter table public.sms_history
  add column if not exists message_id text;

create index if not exists idx_sms_history_message_id on public.sms_history(message_id);

