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
alter table public.profiles add column if not exists verification_doc_path text;
alter table public.profiles add column if not exists email_notifications boolean not null default true;

-- BankID-verifiering (via Criipto/OIDC). Verifierad identitet lagras server-side.
-- OBS: verified_ssn (personnummer) är känslig PII enligt GDPR. RLS ska tillåta
-- att endast användaren själv och service-role/admin läser dessa fält.
alter table public.profiles add column if not exists identity_verified boolean not null default false;
alter table public.profiles add column if not exists verified_name text;
alter table public.profiles add column if not exists verified_ssn text;
alter table public.profiles add column if not exists identity_verified_at timestamptz;
-- Utbetalningsuppgifter för säljare: Swish eller bankkonto.
alter table public.profiles add column if not exists payout_method text;
alter table public.profiles add column if not exists payout_swish text;
alter table public.profiles add column if not exists payout_bank_clearing text;
alter table public.profiles add column if not exists payout_bank_account text;
-- Avstängning: en handlare som backar från ett vunnet bud stängs av och kan inte buda.
alter table public.profiles add column if not exists suspended boolean not null default false;

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

-- Privat bucket för handlarnas verifieringsdokument (företagsbevis/ID).
-- Endast handlaren själv (sin egen mapp) och admin kan läsa dem.
insert into storage.buckets (id, name, public)
values ('dealer-docs', 'dealer-docs', false)
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
    -- Avstängning får bara admin/systemet ändra. Annars kan en avstängd handlare
    -- häva sin egen avstängning via API:t och börja buda igen.
    and suspended is not distinct from (select suspended from public.profiles where id = auth.uid())
    -- Företagsnamn och org.nr är verifieringsuppgifter och får inte ändras av
    -- handlaren själv (endast admin). null hanteras med "is not distinct from".
    and company_name is not distinct from (select company_name from public.profiles where id = auth.uid())
    and org_number is not distinct from (select org_number from public.profiles where id = auth.uid())
    -- Personnummer är en identitetsuppgift och låses när det väl är satt. Får
    -- fortfarande sättas en gång om det saknas (t.ex. äldre konton).
    and (
      personal_number is not distinct from (select personal_number from public.profiles where id = auth.uid())
      or (select personal_number from public.profiles where id = auth.uid()) is null
    )
  );

-- Admins får se OCH hantera alla profiler (t.ex. godkänna handlare).
drop policy if exists "admins see all profiles" on public.profiles;
drop policy if exists "admins manage all profiles" on public.profiles;
create policy "admins manage all profiles" on public.profiles
  for all using (public.is_admin());

-- SÄKERHET: Tidigare fanns en policy "public reads dealer names" som gjorde
-- HELA handlarraden (personnummer, adress, telefon, e-post, org.nr) läsbar för
-- vem som helst – RLS kan inte begränsa kolumner. Vi tar bort den. Handlare
-- visas ändå bara som anonyma kundnummer publikt, så ingen behöver läsa
-- handlarprofiler. Admin läser allt via is_admin, handlaren läser sin egen.
drop policy if exists "public reads dealer names" on public.profiles;

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
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'dealer' and p.approved = true and p.suspended = false)
    and exists (
      select 1 from public.items i
      where i.id = item_id
        and i.status = 'active'
        and (i.auction_ends_at is null or i.auction_ends_at > now())
        and i.owner_id <> auth.uid()  -- får inte buda på sitt eget föremål
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

-- Serverskydd: bud måste vara positiva OCH högre än nuvarande högsta bud, så
-- att ett direkt API-anrop inte kan lägga ett lägre/negativt bud (klienten
-- kollar detta men RLS gjorde det inte tidigare).
alter table public.bids drop constraint if exists bids_amount_positive;
alter table public.bids add constraint bids_amount_positive check (amount > 0);

create or replace function public.enforce_bid_higher()
returns trigger language plpgsql security definer
  set search_path = public as $$
begin
  if new.amount <= coalesce((select max(amount) from public.bids where item_id = new.item_id), 0) then
    raise exception 'Budet måste vara högre än nuvarande högsta bud.';
  end if;
  return new;
end;
$$;
drop trigger if exists on_bid_enforce_higher on public.bids;
create trigger on_bid_enforce_higher
  before insert on public.bids
  for each row execute procedure public.enforce_bid_higher();

-- ============================================================
-- Auto-bud (proxy-budgivning): handlaren sätter ett maxbud och systemet budar
-- åt hen, ett steg i taget, upp till maxet. Priset landar på näst högsta max
-- + ett budsteg (eBay-modellen). Maxet är hemligt för andra.
-- ============================================================
create table if not exists public.auto_bids (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.items on delete cascade not null,
  dealer_id uuid references public.profiles not null,
  max_amount integer not null check (max_amount > 0),
  created_at timestamptz not null default now(),
  unique (item_id, dealer_id)
);
create index if not exists auto_bids_item_idx on public.auto_bids (item_id);
alter table public.auto_bids enable row level security;

-- Bara godkänd, ej avstängd handlare får sätta auto-bud, på aktiv auktion, ej egen vara.
drop policy if exists "dealers set own autobid" on public.auto_bids;
create policy "dealers set own autobid" on public.auto_bids
  for all using (auth.uid() = dealer_id)
  with check (
    auth.uid() = dealer_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'dealer' and p.approved = true and p.suspended = false)
    and exists (
      select 1 from public.items i
      where i.id = item_id and i.status = 'active'
        and (i.auction_ends_at is null or i.auction_ends_at > now())
        and i.owner_id <> auth.uid()
    )
  );
drop policy if exists "admins manage autobids" on public.auto_bids;
create policy "admins manage autobids" on public.auto_bids
  for all using (public.is_admin());

-- Proxy-resolver: räknar ut rätt ledande bud och lägger det åt vinnaren.
-- Idempotent: när den lägger ett bud fyras triggern igen men når då ett stabilt
-- läge och slutar. Ett anrop lägger som mest ett bud.
create or replace function public.resolve_auto_bids(p_item uuid)
returns void language plpgsql security definer
  set search_path = public as $$
declare
  inc int := 100;
  w_dealer uuid;
  w_max int;
  s_max int;
  cur_amount int;
  cur_dealer uuid;
  target int;
begin
  -- Bara aktiv, ej avslutad auktion.
  perform 1 from public.items where id = p_item and status = 'active'
    and (auction_ends_at is null or auction_ends_at > now());
  if not found then return; end if;

  -- Effektivt max per handlare = högsta av auto-bud (godkänd, ej avstängd) och lagda bud.
  -- Vinnare = högsta max (deterministiskt tiebreak på dealer_id), näst högsta = rn 2.
  -- Allt i EN sats: en CTE syns bara i satsen direkt efter, så de två uttagen
  -- måste ligga i samma query (annars: relation "maxes" does not exist).
  with maxes as (
    select dealer_id, max(m) as mx from (
      select ab.dealer_id, ab.max_amount as m
        from public.auto_bids ab
        join public.profiles p on p.id = ab.dealer_id
       where ab.item_id = p_item and p.role = 'dealer' and p.approved = true and p.suspended = false
      union all
      select b.dealer_id, b.amount from public.bids b where b.item_id = p_item
    ) x group by dealer_id
  ), ranked as (
    select dealer_id, mx, row_number() over (order by mx desc, dealer_id) as rn from maxes
  )
  select
    (select dealer_id from ranked where rn = 1),
    (select mx        from ranked where rn = 1),
    (select mx        from ranked where rn = 2)
  into w_dealer, w_max, s_max;

  if w_dealer is null then return; end if;

  select amount, dealer_id into cur_amount, cur_dealer
    from public.bids where item_id = p_item order by amount desc, created_at asc limit 1;

  -- Endast en budgivare: ingen ska buda mot sig själv.
  if s_max is null then return; end if;

  target := least(w_max, s_max + inc);
  if target < coalesce(cur_amount, 0) then target := coalesce(cur_amount, 0); end if;

  -- Vinnaren håller redan rätt (eller högre) bud → klart.
  if cur_dealer = w_dealer and cur_amount >= target then return; end if;

  if target > coalesce(cur_amount, 0) then
    insert into public.bids (item_id, dealer_id, amount) values (p_item, w_dealer, target)
      on conflict (item_id, dealer_id, amount) do nothing;
  end if;
end;
$$;

-- Trigger-wrapper som anropar resolvern med rätt item.
create or replace function public.trigger_resolve_auto_bids()
returns trigger language plpgsql security definer
  set search_path = public as $$
begin
  perform public.resolve_auto_bids(new.item_id);
  return new;
end;
$$;

-- Efter varje bud: låt proxyerna svara.
drop trigger if exists on_bid_resolve_auto on public.bids;
create trigger on_bid_resolve_auto
  after insert on public.bids
  for each row execute procedure public.trigger_resolve_auto_bids();

-- När ett auto-bud sätts/ändras: resolva direkt.
drop trigger if exists on_autobid_resolve on public.auto_bids;
create trigger on_autobid_resolve
  after insert or update on public.auto_bids
  for each row execute procedure public.trigger_resolve_auto_bids();

-- ---- Notifications ----
drop policy if exists "own notifications" on public.notifications;
create policy "own notifications" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "own notifications update" on public.notifications;
create policy "own notifications update" on public.notifications
  for update using (auth.uid() = user_id);

-- ---- Storage ----
drop policy if exists "authenticated upload" on storage.objects;
-- Får bara ladda upp i sin EGEN mapp (första mappsegmentet = uid), precis som
-- inlämningssidan skriver (`${user.id}/...`). Hindrar godtycklig fil-hosting och
-- skrivning i andras mappar.
create policy "authenticated upload" on storage.objects
  for insert with check (
    bucket_id = 'item-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "public read" on storage.objects;
create policy "public read" on storage.objects
  for select using (bucket_id = 'item-images');

-- Verifieringsdokument: handlaren laddar upp i sin egen mapp (namn = uid/fil),
-- och bara handlaren själv eller admin får läsa dem.
drop policy if exists "dealer uploads own docs" on storage.objects;
create policy "dealer uploads own docs" on storage.objects
  for insert with check (
    bucket_id = 'dealer-docs' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "dealer reads own docs" on storage.objects;
create policy "dealer reads own docs" on storage.objects
  for select using (
    bucket_id = 'dealer-docs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- ============================================================
-- Trigger: skapa profil automatiskt vid registrering
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
  set search_path = public as $$
begin
  insert into public.profiles (
    id, email, full_name, role, company_name, approved,
    phone, personal_number, address, postal_code, city, org_number
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    -- SÄKERHET: acceptera bara 'dealer' eller 'customer' från signup-metadata.
    -- Aldrig 'admin' (annars kan vem som helst självregistrera sig som admin).
    -- Admin sätts endast manuellt i SQL.
    case when new.raw_user_meta_data->>'role' = 'dealer' then 'dealer' else 'customer' end,
    new.raw_user_meta_data->>'company_name',
    case when new.raw_user_meta_data->>'role' = 'dealer' then false else true end,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'personal_number',
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'postal_code',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'org_number'
  );

  -- Välkomstbrev (skickas som mejl via notis-webhooken).
  if (new.raw_user_meta_data->>'role') = 'dealer' then
    insert into public.notifications (user_id, title, message, link)
    values (new.id, 'Välkommen till GuldBud 👋',
            'Tack för att du registrerat dig som handlare. Så snart vi verifierat ditt konto kan du börja buda på guld från hela Sverige.',
            '/dealer/dashboard');
  else
    insert into public.notifications (user_id, title, message, link)
    values (new.id, 'Välkommen till GuldBud 👋',
            'Kul att ha dig här! Nu kan du sälja ditt guld och låta auktoriserade handlare buda mot varandra om bästa priset, helt gratis och tryggt.',
            '/customer/submit');
  end if;

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
returns trigger language plpgsql security definer
  set search_path = public as $$
begin
  if new.status = 'active' and coalesce(old.status, '') <> 'active' then
    -- Säljaren: din auktion är live.
    insert into public.notifications (user_id, title, message, item_id)
    values (new.owner_id, 'Din auktion är live',
            'Budgivningen på "' || new.title || '" har öppnat.', new.id);

    -- Alla godkända, ej avstängda handlare: nytt föremål att buda på.
    -- Mejl skickas automatiskt via notifications-webhooken, och hoppas över
    -- för handlare som stängt av e-postnotiser (email_notifications = false).
    insert into public.notifications (user_id, title, message, item_id, link)
    select p.id, 'Nytt föremål på GuldBud',
           'Ett nytt föremål har lagts ut: "' || new.title || '". Lägg ditt bud.',
           new.id, '/auctions/' || new.id
    from public.profiles p
    where p.role = 'dealer' and p.approved = true and p.suspended = false
      and p.id <> new.owner_id;
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
returns trigger language plpgsql security definer
  set search_path = public as $$
declare
  v_owner uuid;
  v_title text;
  v_prev_dealer uuid;
begin
  select owner_id, title into v_owner, v_title from public.items where id = new.item_id;

  -- Notify owner – men inte om ägaren själv råkar vara budgivaren.
  if v_owner is not null and v_owner <> new.dealer_id then
    insert into public.notifications (user_id, title, message, item_id, link)
    values (v_owner, 'Nytt bud på ditt föremål',
            'Ett nytt bud på ' || replace(to_char(new.amount, 'FM999,999,999'), ',', ' ') ||
            ' kr lades på ditt föremål "' || v_title || '".',
            new.item_id, '/auctions/' || new.item_id);
  end if;

  -- Find the previous highest bidder (before this bid), EXCLUDING the person
  -- who just bid, and notify them only if they were actually outbid. This is
  -- what prevents a dealer from being told they outbid themselves.
  select dealer_id into v_prev_dealer
  from public.bids
  where item_id = new.item_id
    and dealer_id <> new.dealer_id
    and amount < new.amount
  order by amount desc
  limit 1;

  if v_prev_dealer is not null then
    insert into public.notifications (user_id, title, message, item_id, link)
    values (v_prev_dealer, 'Du är överbjuden',
            'Ditt bud på "' || v_title || '" har blivit överbjudet. Nytt högsta bud: ' ||
            replace(to_char(new.amount, 'FM999,999,999'), ',', ' ') ||
            ' kr. Lägg ett nytt bud för att ta ledningen.',
            new.item_id, '/auctions/' || new.item_id);
  end if;

  return new;
end;
$$;

-- Städa bort en äldre dubblett-trigger som annars skapar två "överbjuden"-notiser.
drop trigger if exists on_outbid on public.bids;
drop trigger if exists on_bid_created on public.bids;
create trigger on_bid_created
  after insert on public.bids
  for each row execute procedure public.notify_new_bid();

-- Anti-sniping ("soft close"): läggs ett bud när mindre än 2 minuter återstår
-- förlängs auktionen till 2 minuter från nu, så att ingen kan vinna genom att
-- lägga ett bud i sista sekunden utan att andra hinner svara.
create or replace function public.extend_auction_on_late_bid()
returns trigger language plpgsql security definer
  set search_path = public as $$
declare
  v_ends timestamptz;
begin
  select auction_ends_at into v_ends from public.items where id = new.item_id;
  if v_ends is not null and v_ends > now() and v_ends < now() + interval '2 minutes' then
    update public.items
      set auction_ends_at = now() + interval '2 minutes'
      where id = new.item_id;
  end if;
  return new;
end;
$$;
drop trigger if exists on_bid_extend_auction on public.bids;
create trigger on_bid_extend_auction
  after insert on public.bids
  for each row execute procedure public.extend_auction_on_late_bid();

-- ============================================================
-- Notifiering: när ett bud accepteras (auktion stängs)
--  - vinnande handlaren får besked
-- ============================================================
-- notify_bid_accepted() och dess trigger definieras längre ner, i avsnittet
-- "Skapa affär + notiser". Där skapar den affären när ett bud accepteras.
-- (Tidigare fanns en enklare notis-variant här som bara krånglade till det.)

-- ============================================================
-- Notifiering: när en handlare godkänns
-- ============================================================
create or replace function public.notify_dealer_approved()
returns trigger language plpgsql security definer
  set search_path = public as $$
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
returns trigger language plpgsql security definer
  set search_path = public as $$
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

-- Notis till alla admins när en kund lämnar in ett föremål (status 'pending').
create or replace function public.notify_admins_new_item()
returns trigger language plpgsql security definer
  set search_path = public as $$
begin
  if new.status = 'pending' then
    insert into public.notifications (user_id, title, message, item_id, link)
    select p.id,
           'Nytt föremål att granska',
           '"' || new.title || '" har lämnats in och väntar på granskning.',
           new.id,
           '/admin'
    from public.profiles p
    where p.role = 'admin';
  end if;
  return new;
end;
$$;

drop trigger if exists on_new_item_submitted on public.items;
create trigger on_new_item_submitted
  after insert on public.items
  for each row execute procedure public.notify_admins_new_item();

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
returns void language plpgsql security definer
  set search_path = public as $$
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
    order by b.amount desc, b.created_at asc
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
      values (r.owner_id, 'Högsta bud: ' || v_top.amount || ' kr på "' || r.title || '"',
              'Budgivningen landade på ' || v_top.amount || ' kr, strax under ditt reservationspris på ' ||
              r.min_price || ' kr. Du kan ändå välja att godkänna budet och få betalt. ' ||
              'Att sälja är helt kostnadsfritt för dig.',
              r.id, '/auctions/' || r.id);
      insert into public.notifications (user_id, title, message, item_id, link)
      values (v_top.dealer_id, 'Auktionen är avslutad',
              'Du hade det högsta budet på "' || r.title || '". Inväntar säljarens besked.',
              r.id, '/auctions/' || r.id);
    else
      -- Vinnare korad, inväntar säljarens bekräftelse
      insert into public.notifications (user_id, title, message, item_id, link)
      values (r.owner_id, 'Grattis! Ditt föremål fick ' || v_top.amount || ' kr',
              'Budgivningen på "' || r.title || '" landade på ' || v_top.amount ||
              ' kr. Godkänn budet så drar vi igång affären. Du får betalt så snart vi tagit emot ' ||
              'och verifierat föremålet. Att sälja är helt kostnadsfritt för dig.',
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
-- Löpnummer per affär (läsbart fakturanummer, t.ex. GB-000123).
alter table public.orders add column if not exists order_no bigserial;

-- "Handlaren betalar vid vinst": betalningen är ett eget spår, fristående från
-- logistikstegen. Null = obetald, tidsstämpel = registrerad betalning. Först när
-- denna är satt får säljaren betalt och föremålet skickas vidare.
alter table public.orders add column if not exists dealer_paid_at timestamptz;

-- Fas 2: betalnings-deadline, påminnelse-strypning och avboknings-orsak.
alter table public.orders add column if not exists payment_due_at timestamptz;
alter table public.orders add column if not exists payment_reminded_at timestamptz;
alter table public.orders add column if not exists cancel_reason text;

-- A2A-betalning (Brite m.fl.): leverantörsagnostisk referens + status för
-- handlarens inbetalning. dealer_paid_at sätts automatiskt när callbacken
-- bekräftar en lyckad betalning; admin kan fortfarande sätta den manuellt.
alter table public.orders add column if not exists payment_provider text;
alter table public.orders add column if not exists payment_reference text;
alter table public.orders add column if not exists payment_status text; -- 'pending' | 'paid' | 'failed'
-- Retur/kreditering: när ett föremål inte godkänns vid kontroll (fake/stämmer ej).
alter table public.orders add column if not exists refunded_at timestamptz;
alter table public.orders add column if not exists refund_reason text;
-- Backfill: ge befintliga affärer en deadline utifrån när de skapades.
update public.orders set payment_due_at = created_at + interval '3 days'
  where payment_due_at is null;

-- Lägg till betalningssteget (dealer_paid) även om tabellen redan finns sedan tidigare.
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('accepted','shipped_by_seller','received','dealer_paid','verified_paid','shipped_to_dealer','completed','cancelled'));

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
returns trigger language plpgsql security definer
  set search_path = public as $$
declare
  v_dealer uuid;
  v_amount integer;
  v_order uuid;
begin
  if new.status = 'closed' and new.accepted_bid_id is not null
     and (old.accepted_bid_id is distinct from new.accepted_bid_id) then
    select dealer_id, amount into v_dealer, v_amount from public.bids where id = new.accepted_bid_id;

    insert into public.orders (item_id, seller_id, dealer_id, bid_id, amount, payment_due_at)
    values (new.id, new.owner_id, v_dealer, new.accepted_bid_id, v_amount, now() + interval '1 day')
    on conflict (item_id) do nothing;

    select id into v_order from public.orders where item_id = new.id;

    insert into public.notifications (user_id, title, message, item_id, link)
    values (new.owner_id, 'Affär skapad, skicka in föremålet',
            'Budet är accepterat och affären är din. Så fort du godkänt ditt slutpris skickar vi dig ett kostnadsfritt, rekommenderat brev med förbetalt porto, försäkrat upp till 100 000 kr. Lägg föremålet i det och posta det rekommenderat, porto och adress är redan klara. Så snart vi tagit emot och verifierat det får du betalt.',
            new.id, '/orders/' || v_order);

    if v_dealer is not null then
      insert into public.notifications (user_id, title, message, item_id, link)
      values (v_dealer, 'Grattis, du vann budgivningen',
              'Föremålet "' || new.title || '" är ditt. Betala bud + provision omgående, så tar vi emot det från säljaren, kontrollerar äktheten och skickar det vidare till dig. Betalningsinstruktioner finns i affären.',
              new.id, '/orders/' || v_order);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_bid_accepted on public.items;
create trigger on_bid_accepted
  after update on public.items
  for each row execute procedure public.notify_bid_accepted();

-- Notis när admin flyttar affären till nästa steg.
create or replace function public.notify_order_status()
returns trigger language plpgsql security definer
  set search_path = public as $$
declare
  v_title text;
begin
  select title into v_title from public.items where id = new.item_id;
  if new.status is distinct from old.status then
    if new.status = 'received' then
      -- Säljaren: mottaget, kontroll pågår. Handlaren: mottaget, vi skickar vidare.
      insert into public.notifications (user_id, title, message, item_id, link)
      values (new.seller_id, 'Vi har tagit emot ditt föremål',
              'Vi har tagit emot "' || v_title || '" och äkthetskontrollerar det nu. När kontrollen är klar förbereder vi din utbetalning på ' ||
              replace(to_char(new.amount, 'FM999,999,999'), ',', ' ') || ' kr. Fyll gärna i dina utbetalningsuppgifter (Swish eller bankkonto) i din profil så går det snabbt.',
              new.item_id, '/orders/' || new.id);
      insert into public.notifications (user_id, title, message, item_id, link)
      values (new.dealer_id, 'Ditt föremål är mottaget och kontrollerat',
              '"' || v_title || '" är mottaget hos oss och äkthetskontrollerat. Vi packar och skickar det vidare till dig.',
              new.item_id, '/orders/' || new.id);
    elsif new.status = 'verified_paid' then
      insert into public.notifications (user_id, title, message, item_id, link)
      values (new.seller_id, 'Du har fått betalt',
              replace(to_char(new.amount, 'FM999,999,999'), ',', ' ') || ' kr är på väg till ditt konto, normalt inom 1–2 bankdagar. Tack för att du sålde via GuldBud!',
              new.item_id, '/orders/' || new.id);
    elsif new.status = 'shipped_to_dealer' then
      insert into public.notifications (user_id, title, message, item_id, link)
      values (new.dealer_id, 'Ditt föremål är på väg',
              'Vi har skickat "' || v_title || '" till dig. Tack för ditt köp via GuldBud. Hör av dig i affären om du undrar något.',
              new.item_id, '/orders/' || new.id);
    elsif new.status = 'completed' then
      insert into public.notifications (user_id, title, message, item_id, link)
      values (new.seller_id, 'Tack för din affär!',
              'Affären för "' || v_title || '" är helt klar. Tack för att du sålde via GuldBud, vi hoppas att vi ses igen.',
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

-- Bekräftelse när admin registrerar handlarens betalning (dealer_paid_at sätts).
-- Ersätter det gamla dealer_paid-stegets notis och kvitterar mot rätt händelse.
create or replace function public.notify_payment_registered()
returns trigger language plpgsql security definer
set search_path = public as $$
declare
  v_title text;
begin
  if new.dealer_paid_at is not null and old.dealer_paid_at is null then
    select title into v_title from public.items where id = new.item_id;
    insert into public.notifications (user_id, title, message, item_id, link)
    values (new.dealer_id, 'Vi har tagit emot din betalning',
            'Tack! Din betalning för "' || coalesce(v_title, 'föremålet') || '" är registrerad. Vi hör av oss så snart föremålet är mottaget och kontrollerat, och skickar det sedan vidare till dig.',
            new.item_id, '/orders/' || new.id);
  end if;
  return new;
end;
$$;
drop trigger if exists on_payment_registered on public.orders;
create trigger on_payment_registered
  after update on public.orders
  for each row execute procedure public.notify_payment_registered();

-- Retur & kreditering: föremålet godkändes inte vid kontroll. Handlaren krediteras
-- (pengarna åter), säljaren får föremålet tillbaka.
create or replace function public.notify_order_refunded()
returns trigger language plpgsql security definer
  set search_path = public as $$
declare
  v_title text;
begin
  if new.refunded_at is not null and old.refunded_at is null then
    select title into v_title from public.items where id = new.item_id;
    insert into public.notifications (user_id, title, message, item_id, link)
    values (new.dealer_id, 'Affären återgår, du krediteras',
            '"' || coalesce(v_title, 'Föremålet') || '" godkändes inte vid vår kontroll' ||
            coalesce(' (' || new.refund_reason || ')', '') ||
            '. Affären återgår och beloppet återbetalas till dig. En kreditfaktura finns i affären.',
            new.item_id, '/orders/' || new.id);
    insert into public.notifications (user_id, title, message, item_id, link)
    values (new.seller_id, 'Ditt föremål kommer tillbaka',
            'Vid vår kontroll av "' || coalesce(v_title, 'ditt föremål') || '" stämde inte uppgifterna' ||
            coalesce(' (' || new.refund_reason || ')', '') ||
            ', så affären kunde inte slutföras. Vi skickar tillbaka föremålet till dig. Hör av dig i affären om du undrar något.',
            new.item_id, '/orders/' || new.id);
  end if;
  return new;
end;
$$;
drop trigger if exists on_order_refunded on public.orders;
create trigger on_order_refunded
  after update on public.orders
  for each row execute procedure public.notify_order_refunded();

-- DB-broms bakom den klient-sidiga spärren: släpp aldrig utbetalning till säljare
-- eller vidareskick till handlare innan handlarens betalning registrerats.
create or replace function public.enforce_payment_before_release()
returns trigger language plpgsql
set search_path = public as $$
begin
  if new.status in ('verified_paid', 'shipped_to_dealer') and new.dealer_paid_at is null then
    raise exception 'Handlarens betalning måste registreras (dealer_paid_at) innan utbetalning eller vidareskick.';
  end if;
  return new;
end;
$$;
drop trigger if exists on_order_release_guard on public.orders;
create trigger on_order_release_guard
  before update on public.orders
  for each row execute procedure public.enforce_payment_before_release();

-- Modellen: säljaren gör affär med GuldBud och skickar in direkt vid accept.
-- Vi står bakom affären mot säljaren; handlaren är vår verifierade leverantörssida.
-- (Tidigare fas 3-trigger som väntade in handlarens betalning togs bort – säljaren
-- ska aldrig uppleva att vi tvekar på handlaren.)
drop trigger if exists on_dealer_paid on public.orders;
drop function if exists public.notify_dealer_paid();

-- ============================================================
-- Obetalda affärer – påminnelser och avstängning av handlare som backar.
-- Handlaren betalar vid vinst. Betalar hen inte i tid skickar vi först en
-- påminnelse (max en per dygn) och avbryter sedan affären efter en frist.
-- ============================================================
create or replace function public.process_unpaid_orders()
returns void language plpgsql security definer
  set search_path = public as $$
declare
  o record;
  v_title text;
begin
  for o in
    select * from public.orders
    where dealer_paid_at is null
      and status not in ('cancelled', 'completed')
      and payment_due_at is not null
  loop
    select title into v_title from public.items where id = o.item_id;

    if now() > o.payment_due_at + interval '4 days' then
      -- Handlaren backade från ett vunnet bud: stäng av handlaren och larma admin.
      -- GuldBud står för föremålet mot säljaren, så säljaren notifieras inte.
      update public.profiles set suspended = true where id = o.dealer_id;
      -- Sätt status='cancelled' så affären lämnar det öppna flödet och grenen
      -- inte kan fyra igen varje timme (loopen exkluderar 'cancelled').
      update public.orders
        set status = 'cancelled', cancel_reason = 'Betalning uteblev – handlaren avstängd', updated_at = now()
        where id = o.id;

      insert into public.notifications (user_id, title, message, item_id, link)
      values (o.dealer_id, 'Ditt konto har stängts av',
              'Betalningen för "' || coalesce(v_title, 'föremålet') || '" uteblev. Att backa från ett vunnet bud strider mot villkoren, så ditt konto är avstängt. Kontakta oss för att reda ut det.',
              o.item_id, '/orders/' || o.id);
      -- Larma alla administratörer så vi kan säkra säljarens utbetalning och hantera föremålet.
      insert into public.notifications (user_id, title, message, item_id, link)
      select p.id, 'Handlare backade, kräver hantering',
             'Handlaren fullföljde inte köpet av "' || coalesce(v_title, 'föremålet') ||
             '" och har stängts av. Säkerställ att säljaren får betalt och hantera föremålet.',
             o.item_id, '/admin/orders/' || o.id
      from public.profiles p where p.role = 'admin';

    elsif now() > o.payment_due_at
          and (o.payment_reminded_at is null or o.payment_reminded_at < now() - interval '24 hours') then
      -- Förfallen men inom fristen: påminn handlaren, högst en gång per dygn.
      update public.orders set payment_reminded_at = now() where id = o.id;

      insert into public.notifications (user_id, title, message, item_id, link)
      values (o.dealer_id, 'Påminnelse: din betalning väntar',
              'Vi har inte registrerat din betalning för "' || coalesce(v_title, 'föremålet') || '" än. Betala snart så håller vi affären öppen, annars avbryts den automatiskt.',
              o.item_id, '/orders/' || o.id);
    end if;
  end loop;
end;
$$;

-- Kör en gång i timmen via pg_cron.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.unschedule('process-unpaid-orders')
    from cron.job where jobname = 'process-unpaid-orders';
  perform cron.schedule('process-unpaid-orders', '0 * * * *',
    'select public.process_unpaid_orders();');
exception when others then
  raise notice 'pg_cron kunde inte konfigureras automatiskt (%). Aktivera pg_cron under Database > Extensions och kör blocket igen.', sqlerrm;
end $$;

-- Notis när ett meddelande postas: motparten (admin<->part) får besked.
create or replace function public.notify_order_message()
returns trigger language plpgsql security definer
  set search_path = public as $$
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

-- ============================================================
-- Bevakningslista: handlare sparar auktioner och får en påminnelse
-- när de snart avslutas.
-- ============================================================
create table if not exists public.watchlist (
  dealer_id uuid references public.profiles on delete cascade not null,
  item_id uuid references public.items on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (dealer_id, item_id)
);
alter table public.watchlist enable row level security;
drop policy if exists "dealer manages own watchlist" on public.watchlist;
create policy "dealer manages own watchlist" on public.watchlist
  for all using (auth.uid() = dealer_id) with check (auth.uid() = dealer_id);

alter table public.items add column if not exists ending_soon_notified boolean not null default false;

-- Notifiera bevakare när en auktion har mindre än en timme kvar (en gång).
create or replace function public.notify_ending_soon()
returns void language plpgsql security definer
  set search_path = public as $$
declare r record;
begin
  for r in
    select i.* from public.items i
    where i.status = 'active'
      and i.auction_ends_at is not null
      and i.auction_ends_at > now()
      and i.auction_ends_at <= now() + interval '1 hour'
      and i.ending_soon_notified = false
  loop
    insert into public.notifications (user_id, title, message, item_id, link)
    select w.dealer_id, 'Auktion avslutas snart',
           '"' || r.title || '" avslutas inom en timme. Lägg ett bud innan det är för sent.',
           r.id, '/auctions/' || r.id
    from public.watchlist w where w.item_id = r.id;
    update public.items set ending_soon_notified = true where id = r.id;
  end loop;
end; $$;

do $$
begin
  create extension if not exists pg_cron;
  perform cron.unschedule('notify-ending-soon') from cron.job where jobname = 'notify-ending-soon';
  perform cron.schedule('notify-ending-soon', '* * * * *', 'select public.notify_ending_soon();');
exception when others then
  raise notice 'pg_cron ej konfigurerat för notify-ending-soon: %', sqlerrm;
end $$;

-- ============================================================
-- Tvistehantering ("ärenden"): en part i en affär kan formellt
-- anmäla ett problem. Skilt från order_messages (löpande prat) –
-- en tvist har en orsak, en status och en lösning, så plattformen
-- har spårbarhet på vad som gått fel och hur det lösts. Endast admin
-- avgör; parten skriver bara in ärendet.
-- ============================================================
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders on delete cascade not null,
  raised_by uuid references public.profiles not null,
  party text not null check (party in ('seller','dealer')),
  reason text not null,
  description text not null,
  status text not null default 'open'
    check (status in ('open','under_review','resolved','rejected')),
  resolution text,
  resolved_by uuid references public.profiles,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists disputes_order_idx on public.disputes (order_id);
create index if not exists disputes_status_idx on public.disputes (status);

alter table public.disputes enable row level security;

-- Admin ser och hanterar allt.
drop policy if exists "admins manage disputes" on public.disputes;
create policy "admins manage disputes" on public.disputes
  for all using (public.is_admin());

-- En part läser tvister på sina egna affärer.
drop policy if exists "parties read own disputes" on public.disputes;
create policy "parties read own disputes" on public.disputes
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = disputes.order_id
        and (o.seller_id = auth.uid() or o.dealer_id = auth.uid())
    )
  );

-- En part öppnar en tvist på sin egen affär, och bara i sin egen roll
-- (säljaren som 'seller', handlaren som 'dealer'). raised_by måste vara
-- en själv. Parten kan inte uppdatera/avgöra – det gör bara admin.
drop policy if exists "parties open own disputes" on public.disputes;
create policy "parties open own disputes" on public.disputes
  for insert with check (
    raised_by = auth.uid()
    and exists (
      select 1 from public.orders o
      where o.id = disputes.order_id
        and (
          (party = 'seller' and o.seller_id = auth.uid()) or
          (party = 'dealer' and o.dealer_id = auth.uid())
        )
    )
  );

-- Notis till admin när ett ärende öppnas.
create or replace function public.notify_admins_new_dispute()
returns trigger language plpgsql security definer
  set search_path = public as $$
declare
  v_title text;
  v_item_id uuid;
begin
  select i.title, i.id into v_title, v_item_id
  from public.orders o join public.items i on i.id = o.item_id
  where o.id = new.order_id;
  insert into public.notifications (user_id, title, message, item_id, link)
  select p.id,
         'Nytt ärende att hantera',
         'En ' || case new.party when 'seller' then 'säljare' else 'handlare' end ||
           ' har anmält ett problem i affären för "' || coalesce(v_title, 'föremål') || '".',
         v_item_id,
         '/admin/orders/' || new.order_id
  from public.profiles p
  where p.role = 'admin';
  return new;
end;
$$;

drop trigger if exists on_dispute_opened on public.disputes;
create trigger on_dispute_opened
  after insert on public.disputes
  for each row execute procedure public.notify_admins_new_dispute();

-- Notis till parten när admin avgör ärendet (löst eller avslaget).
create or replace function public.notify_dispute_resolved()
returns trigger language plpgsql security definer
  set search_path = public as $$
begin
  if new.status is distinct from old.status
     and new.status in ('resolved','rejected') then
    insert into public.notifications (user_id, title, message, item_id, link)
    values (
      new.raised_by,
      case new.status when 'resolved' then 'Ditt ärende är löst' else 'Svar på ditt ärende' end,
      coalesce(new.resolution, 'GuldBud har hanterat ditt ärende.'),
      null,
      '/orders/' || new.order_id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_dispute_resolved on public.disputes;
create trigger on_dispute_resolved
  after update on public.disputes
  for each row execute procedure public.notify_dispute_resolved();

-- ============================================================
-- AML / ursprungskontroll. Målet: kännas som trygghet för säljaren,
-- inte förhör. Säljaren gör bara en enkel ägarbekräftelse vid inlämning
-- (source_type + attest). Resten (trösklar, flaggor, utbetalningsspärr)
-- jobbar i bakgrunden och syns bara för admin. Vi är helt kontantfria
-- (spårbar in- och utbetalning), vilket sänker tvättrisken rejält.
-- ============================================================

-- Ursprungsdeklaration på föremålet (fylls i vid inlämning).
alter table public.items add column if not exists source_type text;         -- 'arv' | 'eget_kop' | 'eget_smycke' | 'annat'
alter table public.items add column if not exists source_note text;
alter table public.items add column if not exists ownership_attested_at timestamptz;

-- AML-status på affären. null/'clear' = ok, 'review' = kräver granskning,
-- 'approved' = admin har godkänt, 'flagged' = misstänkt (utbetalning spärrad).
alter table public.orders add column if not exists aml_status text;
alter table public.orders add column if not exists aml_flag_reason text;
alter table public.orders add column if not exists aml_reviewed_by uuid references public.profiles;
alter table public.orders add column if not exists aml_reviewed_at timestamptz;
alter table public.orders add column if not exists aml_notes text;

-- Riskbaserad flaggning när affären skapas. Små affärer går rakt igenom
-- ('clear'); stora enskilda eller hög sammanlagd volym per person kräver
-- granskning ('review'). Trösklar: 25 000 kr per affär, 50 000 kr sammanlagt
-- på rullande 12 mån (fångar den som delar upp i många små affärer).
create or replace function public.set_order_aml_status()
returns trigger language plpgsql security definer
  set search_path = public as $$
declare
  v_single constant integer := 25000;
  v_cumulative constant integer := 50000;
  v_prior integer;
begin
  select coalesce(sum(amount), 0) into v_prior
  from public.orders
  where seller_id = new.seller_id
    and status <> 'cancelled'
    and created_at > now() - interval '12 months';

  if new.amount >= v_single then
    new.aml_status := 'review';
    new.aml_flag_reason := 'Enskild affär över ' || v_single || ' kr';
  elsif v_prior + new.amount >= v_cumulative then
    new.aml_status := 'review';
    new.aml_flag_reason := 'Sammanlagd volym över ' || v_cumulative || ' kr på 12 mån';
  else
    new.aml_status := 'clear';
  end if;
  return new;
end;
$$;

drop trigger if exists on_order_set_aml on public.orders;
create trigger on_order_set_aml
  before insert on public.orders
  for each row execute procedure public.set_order_aml_status();

-- Utbetalningsspärr utökad: släpp aldrig pengar (verified_paid/shipped_to_dealer)
-- medan AML-granskning pågår eller affären är flaggad. Befintliga rader har
-- aml_status = null och påverkas inte.
create or replace function public.enforce_payment_before_release()
returns trigger language plpgsql
set search_path = public as $$
begin
  if new.status in ('verified_paid', 'shipped_to_dealer') and new.dealer_paid_at is null then
    raise exception 'Handlarens betalning måste registreras (dealer_paid_at) innan utbetalning eller vidareskick.';
  end if;
  if new.status in ('verified_paid', 'shipped_to_dealer')
     and new.aml_status is not null and new.aml_status not in ('clear', 'approved') then
    raise exception 'AML-granskning krävs innan utbetalning (aml_status=%).', new.aml_status;
  end if;
  return new;
end;
$$;
drop trigger if exists on_order_release_guard on public.orders;
create trigger on_order_release_guard
  before update on public.orders
  for each row execute procedure public.enforce_payment_before_release();

-- Notis till admin när en affär skapas som kräver AML-granskning.
create or replace function public.notify_admins_aml_review()
returns trigger language plpgsql security definer
  set search_path = public as $$
declare
  v_title text;
begin
  if new.aml_status = 'review' then
    select title into v_title from public.items where id = new.item_id;
    insert into public.notifications (user_id, title, message, item_id, link)
    select p.id,
           'Affär att granska (rutinkontroll)',
           'Affären för "' || coalesce(v_title, 'föremål') || '" behöver en snabb granskning innan utbetalning: ' ||
             coalesce(new.aml_flag_reason, 'högre belopp') || '.',
           new.item_id,
           '/admin/orders/' || new.id
    from public.profiles p
    where p.role = 'admin';
  end if;
  return new;
end;
$$;

drop trigger if exists on_order_aml_review on public.orders;
create trigger on_order_aml_review
  after insert on public.orders
  for each row execute procedure public.notify_admins_aml_review();
