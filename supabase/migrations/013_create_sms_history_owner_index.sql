-- Run this separately after migration 012 succeeds
-- This creates the index for better query performance on owner_user_id
-- Only run this if migration 012 completed successfully

create index if not exists sms_history_owner_user_id_idx on public.sms_history(owner_user_id);

