-- Add delivery_status column to track actual delivery vs sent status
alter table public.sms_history
  add column if not exists delivery_status text default 'pending'; -- pending|delivered|failed|unknown

-- Add index for faster queries
create index if not exists idx_sms_history_delivery_status on public.sms_history(delivery_status);

-- Update existing records: if status is 'sent', set delivery_status to 'pending' (need to check)
update public.sms_history
set delivery_status = 'pending'
where status = 'sent' and delivery_status is null;

