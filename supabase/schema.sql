-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. Places Table (Cache of Google Places data)
create table if not exists public.places (
    place_id text primary key,
    name text not null,
    type text not null, -- lodging, restaurant, tourist_attraction, bus_station, train_station, rental, travel_agency, etc.
    lat double precision not ndnull,
    lng double precision not null,
    address text,
    price_level integer, -- 0 to 4
    google_rating numeric,
    user_ratings_total integer,
    photo_refs text[], -- Array of photo reference keys
    contact_number text,
    opening_hours jsonb, -- opening hours details
    website text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for places
alter table public.places enable row level security;

-- Places policies: Anyone can read, but only authenticated users (or system/edge functions) can write/update
create policy "Allow public read access to places" on public.places
    for select using (true);

create policy "Allow all write access to authenticated users" on public.places
    for insert with check (true);

create policy "Allow update to authenticated users" on public.places
    for update using (true);


-- 2. Trips Table (User's saved trips)
create table if not exists public.trips (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade, -- Nullable for guests
    destination text not null,
    lat double precision not null,
    lng double precision not null,
    radius numeric not null, -- in km
    days integer not null,
    budget jsonb not null, -- { type: 'total'|'per_day', total: number, stay_category: string, food_category: string }
    preferences text[] not null, -- Array of selected travel styles
    group_type text not null, -- Solo, Couple, Family, Friends
    travel_mode text not null, -- Self-drive, Public, Rent
    expenses jsonb default '[]'::jsonb,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for trips
alter table public.trips enable row level security;

-- Trips policies: Anyone can read/select trips (for shared links/viewing), but only the user who created it can edit/delete.
-- If user_id is null, it's a guest trip (saved locally in localStorage, or public write)
create policy "Allow public read access to trips" on public.trips
    for select using (true);

create policy "Allow users to insert their own trips" on public.trips
    for insert with check (auth.uid() = user_id or user_id is null);

create policy "Allow users to update their own trips" on public.trips
    for update using (auth.uid() = user_id or user_id is null);

create policy "Allow users to delete their own trips" on public.trips
    for delete using (auth.uid() = user_id or user_id is null);


-- 3. Trip Recommendations Table (Linking trips to recommended places)
create table if not exists public.trip_recommendations (
    id uuid primary key default gen_random_uuid(),
    trip_id uuid references public.trips(id) on delete cascade not null,
    category text not null, -- stay, eat, visit, roam, transport, rental, agency
    place_id text references public.places(place_id) on delete cascade not null,
    score numeric not null,
    day_number integer, -- Null if not assigned to a specific day
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for trip_recommendations
alter table public.trip_recommendations enable row level security;

-- Recommendations policies
create policy "Allow public read access to trip_recommendations" on public.trip_recommendations
    for select using (true);

create policy "Allow write access to trip_recommendations" on public.trip_recommendations
    for insert with check (true);


-- 4. Feedback Table (User reviews of places)
create table if not exists public.feedback (
    id uuid primary key default gen_random_uuid(),
    place_id text references public.places(place_id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    user_name text not null,
    user_avatar text,
    rating integer not null check (rating >= 1 and rating <= 5),
    review_text text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for feedback
alter table public.feedback enable row level security;

-- Feedback policies: Anyone can view reviews, but users must be authenticated to write, update or delete their own reviews.
create policy "Allow public read access to feedback" on public.feedback
    for select using (true);

create policy "Allow authenticated users to insert feedback" on public.feedback
    for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "Allow users to update their own feedback" on public.feedback
    for update using (auth.uid() = user_id);

create policy "Allow users to delete their own feedback" on public.feedback
    for delete using (auth.uid() = user_id);


-- 5. Feedback Photos Table (User-uploaded photos for reviews)
create table if not exists public.feedback_photos (
    id uuid primary key default gen_random_uuid(),
    feedback_id uuid references public.feedback(id) on delete cascade not null,
    photo_url text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for feedback_photos
alter table public.feedback_photos enable row level security;

-- Feedback photos policies
create policy "Allow public read access to feedback_photos" on public.feedback_photos
    for select using (true);

create policy "Allow authenticated users to insert feedback photos" on public.feedback_photos
    for insert with check (true); -- Authenticated users write through feedback workflow

-- Setup Supabase Storage Bucket for Feedback Photos
-- Note: Create a bucket named 'feedback-photos' in Supabase storage and set the following policies:
-- 1. Read: Public (Allow anyone to read objects)
-- 2. Write: Authenticated (Allow authenticated users to upload objects)
