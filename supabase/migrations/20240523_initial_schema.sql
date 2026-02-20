-- Create Enums
create type user_role as enum ('guest', 'host', 'admin');
create type booking_status as enum ('pending', 'awaiting_payment', 'host_verifying', 'confirmed', 'completed', 'cancelled', 'rejected');
create type payment_method as enum ('cash', 'bank_transfer');

-- Create Profiles Table (Extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  phone_number text,
  is_host boolean default false,
  bank_details jsonb, -- { bank_name, iban, account_name }
  created_at timestamptz default now()
);

-- Create Properties Table
create table properties (
  id uuid default uuid_generate_v4() primary key,
  host_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  price_per_night integer not null,
  location_lat float,
  location_lng float,
  city text not null,
  images text[],
  amenities text[],
  max_guests integer default 1,
  created_at timestamptz default now()
);

-- Create Bookings Table
create table bookings (
  id uuid default uuid_generate_v4() primary key,
  property_id uuid references properties(id) on delete cascade not null,
  guest_id uuid references profiles(id) on delete cascade not null,
  host_id uuid references profiles(id) not null, -- Denormalized for RLS
  start_date date not null,
  end_date date not null,
  total_price integer not null,
  status booking_status default 'pending',
  payment_method payment_method not null,
  payment_proof_url text,
  created_at timestamptz default now()
);

-- Create Messages Table
create table messages (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references bookings(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  image_url text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table properties enable row level security;
alter table bookings enable row level security;
alter table messages enable row level security;

-- RLS Policies

-- Profiles: Public read, Self update
create policy "Public profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);

-- Properties: Public read, Host update
create policy "Public properties" on properties for select using (true);
create policy "Hosts can insert properties" on properties for insert with check (auth.uid() = host_id);
create policy "Hosts can update own properties" on properties for update using (auth.uid() = host_id);
create policy "Hosts can delete own properties" on properties for delete using (auth.uid() = host_id);

-- Bookings: Guest view own, Host view own
create policy "Users see their own bookings" on bookings for select using (auth.uid() = guest_id or auth.uid() = host_id);
create policy "Guests can create bookings" on bookings for insert with check (auth.uid() = guest_id);
create policy "Hosts can update booking status" on bookings for update using (auth.uid() = host_id); 
-- Note: Guests might need to update status to 'cancelled', logic to be refined in application or specific policy.

-- Messages: Participants only
create policy "Booking participants can read messages" on messages for select using (
  exists (
    select 1 from bookings
    where bookings.id = messages.booking_id
    and (bookings.guest_id = auth.uid() or bookings.host_id = auth.uid())
  )
);

create policy "Booking participants can send messages" on messages for insert with check (
  exists (
    select 1 from bookings
    where bookings.id = messages.booking_id
    and (bookings.guest_id = auth.uid() or bookings.host_id = auth.uid())
  )
  and auth.uid() = sender_id
);

-- Storage Buckets Setup (SQL representation, usually done via API/Dashboard)
insert into storage.buckets (id, name, public) values ('property-images', 'property-images', true);
insert into storage.buckets (id, name, public) values ('chat-images', 'chat-images', false);
insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', false);

-- Storage Policies (Simplified)
-- Property Images: Public read, Host upload
create policy "Public Access Property Images" on storage.objects for select using (bucket_id = 'property-images');
create policy "Hosts Upload Property Images" on storage.objects for insert with check (bucket_id = 'property-images' and auth.uid() = owner);

-- Chat Images: Participants read, Participants upload
create policy "Participants Read Chat Images" on storage.objects for select using (bucket_id = 'chat-images' and (auth.uid() = owner)); -- Needs refined logic linking to booking
create policy "Participants Upload Chat Images" on storage.objects for insert with check (bucket_id = 'chat-images' and auth.uid() = owner);

-- Payment Proofs: Participants read, Guest upload
create policy "Participants Read Payment Proofs" on storage.objects for select using (bucket_id = 'payment-proofs' and (auth.uid() = owner)); -- Needs refined logic
create policy "Guests Upload Payment Proofs" on storage.objects for insert with check (bucket_id = 'payment-proofs' and auth.uid() = owner);
