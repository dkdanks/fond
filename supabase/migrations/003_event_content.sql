-- Rich content sections for event pages
alter table events add column if not exists content jsonb default '{}';
