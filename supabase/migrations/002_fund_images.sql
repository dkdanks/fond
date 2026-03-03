-- Add image support to registry funds
alter table registry_pools add column if not exists image_url text;
