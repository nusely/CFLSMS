-- Add first_name and last_name, backfill from existing name, and enforce E.164 on phone
alter table public.contacts
  add column if not exists first_name text,
  add column if not exists last_name text;

-- Backfill naive split: first token -> first_name, rest -> last_name
update public.contacts
set first_name = coalesce(first_name, split_part(coalesce(name, ''), ' ', 1)),
    last_name = coalesce(last_name, nullif(regexp_replace(coalesce(name, ''), '^([^ ]+)?\s*', ''), ''))
where true;

-- Drop old name column if exists
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contacts' and column_name = 'name'
  ) then
    alter table public.contacts drop column name;
  end if;
end $$;

-- Add E.164 digits-only CHECK (8-15 digits, not starting with 0)
alter table public.contacts
  drop constraint if exists contacts_phone_e164_chk,
  add constraint contacts_phone_e164_chk check (phone ~ '^[1-9][0-9]{7,14}$');

-- Keep unique phone
-- alter not needed if already unique

