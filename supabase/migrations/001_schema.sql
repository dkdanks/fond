-- Fond database schema

create type event_type as enum ('wedding', 'baby_shower', 'mitzvah', 'housewarming');
create type rsvp_status as enum ('pending', 'attending', 'declined');
create type contribution_status as enum ('pending', 'completed', 'refunded');

-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  email text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Events
create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles not null,
  type event_type not null,
  title text not null,
  slug text unique not null,
  date date,
  location text,
  description text,
  cover_image_url text,
  primary_color text default '#1C1C1C',
  accent_color text default '#C9A96E',
  status text default 'draft',
  created_at timestamptz default now()
);

alter table events enable row level security;
create policy "Owners can manage own events" on events for all using (auth.uid() = user_id);
create policy "Anyone can view published events" on events for select using (status = 'published');

-- Registry pools
create table registry_pools (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events on delete cascade not null,
  title text not null,
  description text,
  target_amount integer,
  created_at timestamptz default now()
);

alter table registry_pools enable row level security;
create policy "Owners can manage registry" on registry_pools for all
  using (exists (select 1 from events where events.id = registry_pools.event_id and events.user_id = auth.uid()));
create policy "Anyone can view registry of published events" on registry_pools for select
  using (exists (select 1 from events where events.id = registry_pools.event_id and events.status = 'published'));

-- Contributions
create table contributions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events on delete cascade not null,
  pool_id uuid references registry_pools on delete set null,
  contributor_name text not null,
  contributor_email text,
  message text,
  amount integer not null,
  fee_amount integer not null,
  status contribution_status default 'pending',
  stripe_payment_intent_id text,
  created_at timestamptz default now()
);

alter table contributions enable row level security;
create policy "Anyone can insert contributions" on contributions for insert with check (true);
create policy "Owners can view contributions" on contributions for select
  using (exists (select 1 from events where events.id = contributions.event_id and events.user_id = auth.uid()));

-- Guests
create table guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events on delete cascade not null,
  name text not null,
  email text not null,
  rsvp_status rsvp_status default 'pending',
  meal_preference text,
  plus_one boolean default false,
  message text,
  invitation_sent_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz default now()
);

alter table guests enable row level security;
create policy "Owners can manage guests" on guests for all
  using (exists (select 1 from events where events.id = guests.event_id and events.user_id = auth.uid()));
create policy "Guests can update their own RSVP" on guests for update
  using (true);
