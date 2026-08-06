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
  category text,
  weight_grams numeric(8,2),
  karat text,
  diamond_carat numeric(6,2),
  gemstone text,
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
alter table public.items add column if not exists category text;
alter table public.items add column if not exists diamond_carat numeric(6,2);
alter table public.items add column if not exists gemstone text;

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
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications add column if not exists link text;

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
drop policy if exists "own profile read" on public.profiles;
drop policy if exists "own profile update" on public.profiles;
-- Alla får läsa sin egen profil ...
create policy "own profile read" on public.profiles
  for select using (auth.uid() = id);
-- ... men vid uppdatering får man INTE ändra sin egen roll eller sitt
-- godkännande (annars skulle en handlare kunna självgodkänna sig via API:t).
create policy "own profile update" on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
    and approved = (select approved from public.profiles where id = auth.uid())
  );

-- Admins får se OCH hantera alla profiler (t.ex. godkänna handlare).
drop policy if exists "admins see all profiles" on public.profiles;
drop policy if exists "admins manage all profiles" on public.profiles;
create policy "admins manage all profiles" on public.profiles
  for all using (public.is_admin());

-- Handlare måste vara synliga så att bud kan visa företagsnamn
drop policy if exists "public reads dealer names" on public.profiles;
create policy "public reads dealer names" on public.profiles
  for select using (role = 'dealer');

-- ---- Items ----
-- Ägaren hanterar sina egna föremål, MEN får inte själv aktivera dem
-- (kringgå granskning). with check tillåter bara 'pending' (utkast/redigering)
-- och 'closed' (när ägaren accepterar ett bud). Admin sätter 'active'/'rejected'.
drop policy if exists "owner manages own items" on public.items;
create policy "owner manages own items" on public.items
  for all using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id and status in ('pending', 'closed'));

drop policy if exists "active items are public" on public.items;
create policy "active items are public" on public.items
  for select using (status in ('active','closed'));

drop policy if exists "admins manage all items" on public.items;
create policy "admins manage all items" on public.items
  for all using (public.is_admin());

-- ---- Bids ----
-- Endast godkända handlare får buda, och bara på aktiva auktioner vars
-- sluttid inte passerat. Stoppar bud efter auktionens slut på servernivå.
drop policy if exists "dealers can bid" on public.bids;
create policy "dealers can bid" on public.bids
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'dealer' and p.approved = true)
    and exists (
      select 1 from public.items i
      where i.id = item_id
        and i.status = 'active'
        and (i.auction_ends_at is null or i.auction_ends_at > now())
    )
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
    values (new.owner_id, 'Din auktion är live',
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
  values (v_owner, 'Nytt bud',
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
      values (v_dealer, 'Ditt bud accepterades',
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
-- Notifiering: när en handlare godkänns
-- ============================================================
create or replace function public.notify_dealer_approved()
returns trigger language plpgsql security definer as $$
begin
  if new.role = 'dealer' and new.approved = true and coalesce(old.approved, false) = false then
    insert into public.notifications (user_id, title, message)
    values (new.id, 'Ditt handlarkonto är godkänt',
            'Välkommen! Du kan nu logga in och lägga bud på auktionerna.');
  end if;
  return new;
end;
$$;

drop trigger if exists on_dealer_approved on public.profiles;
create trigger on_dealer_approved
  after update on public.profiles
  for each row execute procedure public.notify_dealer_approved();

-- ============================================================
-- Notifiering: när en ny handlare registrerar sig -> alla admins
-- ============================================================
create or replace function public.notify_admins_new_dealer()
returns trigger language plpgsql security definer as $$
begin
  if new.role = 'dealer' and coalesce(new.approved, false) = false then
    insert into public.notifications (user_id, title, message, link)
    select p.id,
           'Ny handlare väntar på godkännande',
           coalesce(new.company_name, new.full_name, 'En handlare') || ' har registrerat sig.',
           '/admin'
    from public.profiles p
    where p.role = 'admin';
  end if;
  return new;
end;
$$;

drop trigger if exists on_new_dealer_registered on public.profiles;
create trigger on_new_dealer_registered
  after insert on public.profiles
  for each row execute procedure public.notify_admins_new_dealer();

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

-- ============================================================
-- Auto-avslut: när en auktions sluttid passerats notifieras
-- säljaren (bekräfta högsta budet) och den vinnande handlaren.
-- Statusen lämnas som 'active' tills säljaren accepterar ett bud
-- (då sätts accepted_bid_id och status='closed' via befintligt
-- flöde). Föremålet är redan bortfiltrerat ur listorna via
-- auction_ends_at, så budgivningen är i praktiken stängd.
-- ============================================================
alter table public.items add column if not exists ended_notified boolean not null default false;

create or replace function public.settle_ended_auctions()
returns void language plpgsql security definer as $$
declare
  r record;
  v_top record;
begin
  for r in
    select * from public.items
    where status = 'active'
      and auction_ends_at is not null
      and auction_ends_at <= now()
      and ended_notified = false
  loop
    select b.id, b.dealer_id, b.amount into v_top
    from public.bids b
    where b.item_id = r.id
    order by b.amount desc
    limit 1;

    if v_top.id is null then
      -- Inga bud
      insert into public.notifications (user_id, title, message, item_id, link)
      values (r.owner_id, 'Din auktion avslutades utan bud',
              'Inga bud kom in på "' || r.title || '". Du kan lägga ut föremålet igen.',
              r.id, '/auctions/' || r.id);
    elsif r.min_price is not null and v_top.amount < r.min_price then
      -- Reservationspris ej uppnått
      insert into public.notifications (user_id, title, message, item_id, link)
      values (r.owner_id, 'Auktionen nådde inte ditt minimipris',
              'Högsta bud blev ' || v_top.amount || ' kr på "' || r.title ||
              '", under ditt minimipris. Du kan ändå välja att acceptera.',
              r.id, '/auctions/' || r.id);
      insert into public.notifications (user_id, title, message, item_id, link)
      values (v_top.dealer_id, 'Auktionen är avslutad',
              'Du hade det högsta budet på "' || r.title || '". Inväntar säljarens besked.',
              r.id, '/auctions/' || r.id);
    else
      -- Vinnare korad, inväntar säljarens bekräftelse
      insert into public.notifications (user_id, title, message, item_id, link)
      values (r.owner_id, 'Din auktion har avslutats',
              'Högsta bud blev ' || v_top.amount || ' kr på "' || r.title ||
              '". Bekräfta budet för att slutföra affären.',
              r.id, '/auctions/' || r.id);
      insert into public.notifications (user_id, title, message, item_id, link)
      values (v_top.dealer_id, 'Du hade det högsta budet',
              'Auktionen på "' || r.title || '" är avslutad. Inväntar säljarens bekräftelse.',
              r.id, '/auctions/' || r.id);
    end if;

    update public.items set ended_notified = true where id = r.id;
  end loop;
end;
$$;

-- Schemalägg funktionen varje minut via pg_cron. Om tillägget inte
-- kan aktiveras automatiskt: aktivera "pg_cron" under
-- Database > Extensions i Supabase och kör detta block igen.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.unschedule('settle-ended-auctions')
    from cron.job where jobname = 'settle-ended-auctions';
  perform cron.schedule('settle-ended-auctions', '* * * * *',
    'select public.settle_ended_auctions();');
exception when others then
  raise notice 'pg_cron kunde inte konfigureras automatiskt (%). Aktivera pg_cron under Database > Extensions och kör blocket igen.', sqlerrm;
end $$;

-- ============================================================
-- Affärer (orders): skapas när säljaren accepterar ett bud.
-- GuldBud är nav: säljare -> GuldBud (kontroll + utbetalning) -> handlare.
-- ============================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.items on delete cascade not null,
  seller_id uuid references public.profiles not null,
  dealer_id uuid references public.profiles not null,
  bid_id uuid references public.bids not null,
  amount integer not null,
  status text not null default 'accepted'
    check (status in ('accepted','shipped_by_seller','received','verified_paid','shipped_to_dealer','completed','cancelled')),
  tracking_seller text,
  tracking_dealer text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id)
);
create index if not exists orders_seller_idx on public.orders (seller_id);
create index if not exists orders_dealer_idx on public.orders (dealer_id);

-- Meddelanden i en affär. "party" avgör tråd: säljar-sidan eller handlar-sidan.
-- Admin postar i valfri tråd; säljaren bara i 'seller', handlaren bara i 'dealer'.
-- Så kan admin prata med båda parter utan att de ser varandra.
create table if not exists public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders on delete cascade not null,
  sender_id uuid references public.profiles not null,
  party text not null check (party in ('seller','dealer')),
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists order_messages_order_idx on public.order_messages (order_id, created_at);

alter table public.orders enable row level security;
alter table public.order_messages enable row level security;

-- ---- Orders RLS ----
drop policy if exists "admins manage orders" on public.orders;
create policy "admins manage orders" on public.orders
  for all using (public.is_admin());

drop policy if exists "parties read own orders" on public.orders;
create policy "parties read own orders" on public.orders
  for select using (auth.uid() = seller_id or auth.uid() = dealer_id);

-- ---- Order messages RLS ----
drop policy if exists "admins manage order messages" on public.order_messages;
create policy "admins manage order messages" on public.order_messages
  for all using (public.is_admin());

-- Säljaren läser/skriver bara i sin egen affärs 'seller'-tråd.
drop policy if exists "seller reads own thread" on public.order_messages;
create policy "seller reads own thread" on public.order_messages
  for select using (
    party = 'seller'
    and exists (select 1 from public.orders o where o.id = order_id and o.seller_id = auth.uid())
  );
drop policy if exists "seller writes own thread" on public.order_messages;
create policy "seller writes own thread" on public.order_messages
  for insert with check (
    party = 'seller' and sender_id = auth.uid()
    and exists (select 1 from public.orders o where o.id = order_id and o.seller_id = auth.uid())
  );

-- Handlaren läser/skriver bara i sin egen affärs 'dealer'-tråd.
drop policy if exists "dealer reads own thread" on public.order_messages;
create policy "dealer reads own thread" on public.order_messages
  for select using (
    party = 'dealer'
    and exists (select 1 from public.orders o where o.id = order_id and o.dealer_id = auth.uid())
  );
drop policy if exists "dealer writes own thread" on public.order_messages;
create policy "dealer writes own thread" on public.order_messages
  for insert with check (
    party = 'dealer' and sender_id = auth.uid()
    and exists (select 1 from public.orders o where o.id = order_id and o.dealer_id = auth.uid())
  );

-- Skapa affär + notiser när ett bud accepteras (ersätter tidigare notify_bid_accepted).
create or replace function public.notify_bid_accepted()
returns trigger language plpgsql security definer as $$
declare
  v_dealer uuid;
  v_amount integer;
  v_order uuid;
begin
  if new.status = 'closed' and new.accepted_bid_id is not null
     and (old.accepted_bid_id is distinct from new.accepted_bid_id) then
    select dealer_id, amount into v_dealer, v_amount from public.bids where id = new.accepted_bid_id;

    insert into public.orders (item_id, seller_id, dealer_id, bid_id, amount)
    values (new.id, new.owner_id, v_dealer, new.accepted_bid_id, v_amount)
    on conflict (item_id) do nothing;

    select id into v_order from public.orders where item_id = new.id;

    insert into public.notifications (user_id, title, message, item_id, link)
    values (new.owner_id, 'Affär skapad',
            'Budet är accepterat. Följ affären och skicka föremålet till oss.',
            new.id, '/orders/' || v_order);

    if v_dealer is not null then
      insert into public.notifications (user_id, title, message, item_id, link)
      values (v_dealer, 'Ditt bud accepterades',
              'Säljaren accepterade ditt bud på "' || new.title || '". Följ affären här.',
              new.id, '/orders/' || v_order);
    end if;
  end if;
  return new;
end;
$$;

-- Notis när admin flyttar affären till nästa steg.
create or replace function public.notify_order_status()
returns trigger language plpgsql security definer as $$
declare
  v_title text;
begin
  select title into v_title from public.items where id = new.item_id;
  if new.status is distinct from old.status then
    if new.status = 'received' then
      insert into public.notifications (user_id, title, message, item_id, link)
      values (new.seller_id, 'Vi har tagit emot ditt föremål',
              'GuldBud har mottagit "' || v_title || '" och påbörjar äkthetskontrollen.',
              new.item_id, '/orders/' || new.id);
    elsif new.status = 'verified_paid' then
      insert into public.notifications (user_id, title, message, item_id, link)
      values (new.seller_id, 'Godkänt och utbetalt',
              'Äktheten är godkänd och betalningen för "' || v_title || '" är på väg via Swish.',
              new.item_id, '/orders/' || new.id);
    elsif new.status = 'shipped_to_dealer' then
      insert into public.notifications (user_id, title, message, item_id, link)
      values (new.dealer_id, 'Ditt föremål är på väg',
              '"' || v_title || '" har skickats till dig.',
              new.item_id, '/orders/' || new.id);
    elsif new.status = 'completed' then
      insert into public.notifications (user_id, title, message, item_id, link)
      values (new.seller_id, 'Affären är slutförd',
              'Affären för "' || v_title || '" är avslutad. Tack!',
              new.item_id, '/orders/' || new.id);
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists on_order_status on public.orders;
create trigger on_order_status
  after update on public.orders
  for each row execute procedure public.notify_order_status();

-- Notis när ett meddelande postas: motparten (admin<->part) får besked.
create or replace function public.notify_order_message()
returns trigger language plpgsql security definer as $$
declare
  v_order public.orders;
  v_recipient uuid;
  v_sender_is_admin boolean;
begin
  select * into v_order from public.orders where id = new.order_id;
  select public.is_admin() into v_sender_is_admin;

  if v_sender_is_admin then
    -- Admin skrev -> parten i den tråden får notis
    v_recipient := case when new.party = 'seller' then v_order.seller_id else v_order.dealer_id end;
    insert into public.notifications (user_id, title, message, item_id, link)
    values (v_recipient, 'Nytt meddelande från GuldBud',
            left(new.body, 120), v_order.item_id, '/orders/' || v_order.id);
  else
    -- Part skrev -> alla admins får notis
    insert into public.notifications (user_id, title, message, item_id, link)
    select p.id, 'Nytt meddelande i en affär', left(new.body, 120),
           v_order.item_id, '/admin/orders/' || v_order.id
    from public.profiles p where p.role = 'admin';
  end if;
  return new;
end;
$$;
drop trigger if exists on_order_message on public.order_messages;
create trigger on_order_message
  after insert on public.order_messages
  for each row execute procedure public.notify_order_message();

-- Realtime för affärschatt + status.
do $$
begin
  begin alter publication supabase_realtime add table public.orders;
  exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.order_messages;
  exception when duplicate_object then null; end;
end $$;
