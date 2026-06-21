-- ============================================================
-- GuldBud – Supabase Schema
-- Kör detta i Supabase > SQL Editor
-- ============================================================

-- Profiler (utökar auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null default 'customer' check (role in ('customer','dealer','admin')),
  company_name text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Föremål som kunder lägger ut
create table public.items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles not null,
  title text not null,
  description text,
  weight_grams numeric(8,2),
  karat text,
  min_price integer,
  status text not null default 'pending'
    check (status in ('pending','approved','active','closed','rejected')),
  image_urls text[] not null default '{}',
  auction_ends_at timestamptz,
  created_at timestamptz not null default now()
);

-- Bud från guldhandlare
create table public.bids (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.items on delete cascade not null,
  dealer_id uuid references public.profiles not null,
  amount integer not null,
  created_at timestamptz not null default now(),
  unique (item_id, dealer_id, amount)
);

-- Storage bucket för bilder
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.bids enable row level security;

-- Profiles: användare ser sin egen profil, admins ser alla
create policy "own profile" on public.profiles
  for all using (auth.uid() = id);

create policy "admins see all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Items: ägaren ser sina, aktiva objekt är publika, admins ser alla
create policy "owner manages own items" on public.items
  for all using (auth.uid() = owner_id);

create policy "active items are public" on public.items
  for select using (status = 'active');

create policy "admins manage all items" on public.items
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Bids: godkända handlare budar, handlaren ser egna bud, alla ser bud på aktiva
create policy "dealers can bid" on public.bids
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'dealer' and approved = true)
  );

create policy "dealers see own bids" on public.bids
  for select using (auth.uid() = dealer_id);

create policy "public sees bids on active items" on public.bids
  for select using (
    exists (select 1 from public.items where id = item_id and status = 'active')
  );

-- Storage: inloggade kan ladda upp, publikt läsbar
create policy "authenticated upload" on storage.objects
  for insert with check (bucket_id = 'item-images' and auth.role() = 'authenticated');

create policy "public read" on storage.objects
  for select using (bucket_id = 'item-images');

-- ============================================================
-- Trigger: skapa profil automatiskt vid registrering
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role, company_name, approved)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    new.raw_user_meta_data->>'company_name',
    case when coalesce(new.raw_user_meta_data->>'role', 'customer') = 'customer' then true else false end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
