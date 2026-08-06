-- ============================================================
-- GuldBud – Supabase Schema
-- Kör hela filen i Supabase > SQL Editor.
-- Säker att köra på nytt: använder "if not exists" där det går.
-- ============================================================

-- ------------------------------------------------------------
-- Profiler (utökar auth.users)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null default 'customer' check (role in ('customer','dealer','admin')),
  company_name text,
  approved boolean not null default false,
  -- utökade uppgifter från registreringen
  phone text,
  personal_number text,
  address text,
  postal_code text,
  city text,
  org_number text,
  created_at timestamptz not null default now()
);

-- Lägg till kolumner om en äldre tabell redan finns
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists personal_number text;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists postal_code text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists org_number text;

-- ------------------------------------------------------------
-- Föremål som kunder lägger ut
-- ------------------------------------------------------------
create table if not exists public.items (
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
  accepted_bid_id uuid,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.items add column if not exists accepted_bid_id uuid;
alter table public.items add column if not exists accepted_at timestamptz;

-- ------------------------------------------------------------
-- Bud från guldhandlare
-- ------------------------------------------------------------
create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.items on delete cascade not null,
  dealer_id uuid references public.profiles not null,
  amount integer not null,
  created_at timestamptz not null default now(),
  unique (item_id, dealer_id, amount)
);

create index if not exists bids_item_id_idx on public.bids (item_id);
create index if not exists items_status_idx on public.items (status);

-- ------------------------------------------------------------
-- Notifieringar
-- ------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  title text not null,
  message text,
  item_id uuid references public.items on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- Säkerställ att kopplingarna städas bort automatiskt även om tabellen redan
-- fanns sedan tidigare (create table ovan hoppas över då och lämnar gamla FK-regler).
alter table public.notifications
  drop constraint if exists notifications_item_id_fkey,
  add constraint notifications_item_id_fkey
    foreign key (item_id) references public.items(id) on delete cascade;

alter table public.notifications
  drop constraint if exists notifications_user_id_fkey,
  add constraint notifications_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade;

-- ------------------------------------------------------------
-- Storage bucket för bilder
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do nothing;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.bids enable row level security;
alter table public.notifications enable row level security;

-- Non-recursive admin-check. SECURITY DEFINER kör som ägaren och kringgår RLS
-- internt, så vi undviker "infinite recursion" när en profiles-policy annars
-- skulle fråga profiles-tabellen igen.
create or replace function public.is_admin()
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---- Profiles ----
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id);

drop policy if exists "admins see all profiles" on public.profiles;
create policy "admins see all profiles" on public.profiles
  for select using (public.is_admin());

-- Handlare måste vara synliga så att bud kan visa företagsnamn
drop policy if exists "public reads dealer names" on public.profiles;
create policy "public reads dealer names" on public.profiles
  for select using (role = 'dealer');

-- ---- Items ----
drop policy if exists "owner manages own items" on public.items;
create policy "owner manages own items" on public.items
  for all using (auth.uid() = owner_id);

drop policy if exists "active items are public" on public.items;
create policy "active items are public" on public.items
  for select using (status in ('active','closed'));

drop policy if exists "admins manage all items" on public.items;
create policy "admins manage all items" on public.items
  for all using (public.is_admin());

-- ---- Bids ----
drop policy if exists "dealers can bid" on public.bids;
create policy "dealers can bid" on public.bids
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'dealer' and p.approved = true)
  );

drop policy if exists "dealers see own bids" on public.bids;
create policy "dealers see own bids" on public.bids
  for select using (auth.uid() = dealer_id);

drop policy if exists "public sees bids on active items" on public.bids;
create policy "public sees bids on active items" on public.bids
  for select using (
    exists (select 1 from public.items i where i.id = item_id and i.status in ('active','closed'))
  );

-- ---- Notifications ----
drop policy if exists "own notifications" on public.notifications;
create policy "own notifications" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "own notifications update" on public.notifications;
create policy "own notifications update" on public.notifications
  for update using (auth.uid() = user_id);

-- ---- Storage ----
drop policy if exists "authenticated upload" on storage.objects;
create policy "authenticated upload" on storage.objects
  for insert with check (bucket_id = 'item-images' and auth.role() = 'authenticated');

drop policy if exists "public read" on storage.objects;
create policy "public read" on storage.objects
  for select using (bucket_id = 'item-images');

-- ============================================================
-- Trigger: skapa profil automatiskt vid registrering
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (
    id, email, full_name, role, company_name, approved,
    phone, personal_number, address, postal_code, city, org_number
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    new.raw_user_meta_data->>'company_name',
    case when coalesce(new.raw_user_meta_data->>'role', 'customer') = 'customer' then true else false end,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'personal_number',
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'postal_code',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'org_number'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Notifiering: när en auktion öppnas (status -> active)
-- ============================================================
create or replace function public.notify_auction_live()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'active' and coalesce(old.status, '') <> 'active' then
    insert into public.notifications (user_id, title, message, item_id)
    values (new.owner_id, 'Din auktion är live! 🔔',
            'Budgivningen på "' || new.title || '" har öppnat.', new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_item_activated on public.items;
create trigger on_item_activated
  after update on public.items
  for each row execute procedure public.notify_auction_live();

-- ============================================================
-- Notifiering: vid nytt bud
--  - ägaren får "nytt bud"
--  - den tidigare ledande handlaren får "du är överbjuden"
-- ============================================================
create or replace function public.notify_new_bid()
returns trigger language plpgsql security definer as $$
declare
  v_owner uuid;
  v_title text;
  v_prev_dealer uuid;
begin
  select owner_id, title into v_owner, v_title from public.items where id = new.item_id;

  -- Notify owner
  insert into public.notifications (user_id, title, message, item_id)
  values (v_owner, 'Nytt bud! 💰',
          'Ett nytt bud på ' || new.amount || ' kr lades på "' || v_title || '".', new.item_id);

  -- Find previous highest bidder (before this bid) and notify them if outbid
  select dealer_id into v_prev_dealer
  from public.bids
  where item_id = new.item_id and id <> new.id and amount < new.amount
  order by amount desc
  limit 1;

  if v_prev_dealer is not null and v_prev_dealer <> new.dealer_id then
    insert into public.notifications (user_id, title, message, item_id)
    values (v_prev_dealer, 'Du är överbjuden',
            'Någon har lagt ett högre bud på "' || v_title || '". Lägg ett nytt bud för att ta ledningen.', new.item_id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_bid_created on public.bids;
create trigger on_bid_created
  after insert on public.bids
  for each row execute procedure public.notify_new_bid();

-- ============================================================
-- Notifiering: när ett bud accepteras (auktion stängs)
--  - vinnande handlaren får besked
-- ============================================================
create or replace function public.notify_bid_accepted()
returns trigger language plpgsql security definer as $$
declare
  v_dealer uuid;
begin
  if new.status = 'closed' and new.accepted_bid_id is not null
     and (old.accepted_bid_id is distinct from new.accepted_bid_id) then
    select dealer_id into v_dealer from public.bids where id = new.accepted_bid_id;
    if v_dealer is not null then
      insert into public.notifications (user_id, title, message, item_id)
      values (v_dealer, 'Ditt bud accepterades! 🎉',
              'Säljaren accepterade ditt bud på "' || new.title || '".', new.id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_bid_accepted on public.items;
create trigger on_bid_accepted
  after update on public.items
  for each row execute procedure public.notify_bid_accepted();

-- ============================================================
-- Realtime: publicera bud och notifieringar så att UI:t
-- uppdateras live (budhistorik + notisklockan).
-- ============================================================
do $$
begin
  begin
    alter publication supabase_realtime add table public.bids;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null;
  end;
end $$;
