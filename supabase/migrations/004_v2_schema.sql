-- V2 schema additions

-- Add birthday to event_type enum
alter type event_type add value if not exists 'birthday';

-- Add host name fields and access password to events
alter table events
  add column if not exists host_name text,
  add column if not exists partner_name text,
  add column if not exists access_password text;

-- Add group support to registry_pools
alter table registry_pools
  add column if not exists group_name text,
  add column if not exists display_order integer default 0;

-- Add font preference to events
alter table events
  add column if not exists font_family text default 'Inter';
