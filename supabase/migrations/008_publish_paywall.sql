alter type event_type add value if not exists 'other';

alter table events
  add column if not exists publish_fee_status text not null default 'unpaid',
  add column if not exists publish_fee_paid_at timestamptz,
  add column if not exists publish_fee_checkout_session_id text,
  add column if not exists published_at timestamptz;

update events
set
  publish_fee_status = 'paid',
  publish_fee_paid_at = coalesce(publish_fee_paid_at, now()),
  published_at = coalesce(published_at, now())
where status = 'published';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_publish_fee_status_check'
  ) then
    alter table events
      add constraint events_publish_fee_status_check
      check (publish_fee_status in ('unpaid', 'pending', 'paid'));
  end if;
end $$;

create index if not exists events_user_id_created_at_idx on events (user_id, created_at desc);
create index if not exists events_user_id_date_idx on events (user_id, date);

create or replace function enforce_upcoming_event_limit()
returns trigger
language plpgsql
as $$
declare
  upcoming_count integer;
begin
  if new.date is not null and new.date < current_date then
    return new;
  end if;

  select count(*)
    into upcoming_count
  from events
  where user_id = new.user_id
    and id <> new.id
    and (date is null or date >= current_date);

  if upcoming_count >= 3 then
    raise exception 'You can only have 3 upcoming events at the same time.';
  end if;

  return new;
end;
$$;

drop trigger if exists events_upcoming_limit on events;

create trigger events_upcoming_limit
  before insert or update of date, user_id on events
  for each row
  execute function enforce_upcoming_event_limit();
