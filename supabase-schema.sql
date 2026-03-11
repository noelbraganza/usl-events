-- ============================================================
-- USL Events — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Profiles (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- 2. Events
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  tagline text,
  description text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  location text not null,
  location_url text,
  capacity integer,
  published boolean default false,
  status text default 'upcoming' check (status in ('upcoming', 'live', 'past', 'cancelled')),
  cover_image text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table events enable row level security;

-- Anyone can read published events
create policy "Published events are public"
  on events for select using (published = true);

-- Only authenticated users (admin) can manage events
create policy "Authenticated users can manage events"
  on events for all using (auth.role() = 'authenticated');

-- 3. Event Speakers
create table if not exists event_speakers (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events on delete cascade not null,
  name text not null,
  title text,
  bio text,
  avatar_url text,
  display_order integer default 0,
  created_at timestamptz default now()
);

alter table event_speakers enable row level security;

create policy "Event speakers are public"
  on event_speakers for select using (true);

create policy "Authenticated users can manage speakers"
  on event_speakers for all using (auth.role() = 'authenticated');

-- 4. RSVPs
create table if not exists rsvps (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  email text not null,
  name text,
  status text default 'confirmed' check (status in ('confirmed', 'waitlist', 'cancelled')),
  notes text,
  invite_sent boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(event_id, user_id)
);

alter table rsvps enable row level security;

-- Users can see their own RSVPs
create policy "Users can view own rsvps"
  on rsvps for select using (auth.uid() = user_id);

-- Users can create their own RSVPs
create policy "Users can create rsvps"
  on rsvps for insert with check (auth.uid() = user_id);

-- Users can update their own RSVPs (for cancellation)
create policy "Users can update own rsvps"
  on rsvps for update using (auth.uid() = user_id);

-- Authenticated admin can see all RSVPs
create policy "Admin can view all rsvps"
  on rsvps for select using (auth.role() = 'authenticated');

create policy "Admin can manage all rsvps"
  on rsvps for all using (auth.role() = 'authenticated');

-- 5. Trigger: auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    updated_at = now();
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Seed: "AI for Non-Dummies" event
insert into events (
  title,
  slug,
  tagline,
  description,
  start_date,
  end_date,
  location,
  location_url,
  capacity,
  published
) values (
  'AI for Non-Dummies',
  'ai-for-non-dummies',
  'A casual AI workshop/meetup for builders, designers and founders in Gothenburg.',
  E'The past few months, AI has helped us build a bunch of apps, tools and automations that have completely changed how Up Strategy Lab operates. We''re a small team but we work like we''re not — maybe 10x, possibly 100x more output than before.\n\nThis is a casual session in Gothenburg where we share how we got there. All of it: the tools, the workflows, the things that actually stuck. We''ll cover everything from Claude Code to AI agents, and how AI has touched almost every part of our work — design, sales, marketing, automations.\n\nNo dummies here. Just curious people figuring out what''s next.',
  '2026-03-27 16:00:00+01',
  '2026-03-27 19:00:00+01',
  'Nordhemsgatan 56, Göteborg',
  'https://maps.google.com/?q=Nordhemsgatan+56+Gothenburg',
  50,
  true
)
on conflict (slug) do nothing;

-- Seed speaker
insert into event_speakers (event_id, name, title, bio, display_order)
select
  id,
  'Noel Braganza',
  'Co-founder, Up Strategy Lab & MuchSkills',
  E'Noel Braganza is a designer and founder who works at the intersection of technology, behaviour and clear, thoughtful design. As Co-founder of MuchSkills.com and Up Strategy Lab, he draws on a background in Interaction Design and research experience at the MIT Design Lab to build practical tools that help people and organisations understand themselves better.\n\nHe is especially interested in questioning inherited assumptions — about work, skills, growth and what it means to build a company with integrity.',
  0
from events where slug = 'ai-for-non-dummies'
on conflict do nothing;
