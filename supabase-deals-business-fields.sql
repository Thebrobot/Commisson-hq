-- Optional business profile fields filled by the client name lookup.
alter table public.deals add column if not exists client_address text;
alter table public.deals add column if not exists client_website text;
