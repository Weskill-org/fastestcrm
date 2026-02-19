alter table companies
add column if not exists mask_leads boolean default false;
