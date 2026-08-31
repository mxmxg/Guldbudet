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
    -- BankID-verifieringen (KYC) får bara sättas av service-role (callbacken) och
    -- admin, aldrig av användaren själv. Annars kan vem som helst PATCH:a sin egen
    -- rad och sätta identity_verified=true med påhittat personnummer, hela KYC/AML-
    -- grunden kringgås. Admin uppdaterar via sin egen "for all"-policy (utan check),
    -- och service-role kringgår RLS helt, så callbacken kan fortfarande skriva dem.
    and identity_verified is not distinct from (select identity_verified from public.profiles where id = auth.uid())
    and verified_name is not distinct from (select verified_name from public.profiles where id = auth.uid())
    and verified_ssn is not distinct from (select verified_ssn from public.profiles where id = auth.uid())
    and identity_verified_at is not distinct from (select identity_verified_at from public.profiles where id = auth.uid())
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
-- ---------------------------------------------------------------------------
-- Vem som får buda. Ett predikat, inte tre kopior.
--
-- Startsidan lovar "BankID-verifierade handlare". Kravet fanns inte: en
-- handlare kom in via ett formulär och admins godkännande och gick aldrig genom
-- BankID-flödet. Nu är löftet en spärr.
--
-- Regeln behövs på tre ställen: buda, sätta autobud, och när ett autobud löses
-- ut. Tre kopior glider isär, och på lanseringsdagen ska kravet skärpas på ett
-- ställe, inte tre.
--
-- Precis som listningskravet för säljaren speglar den här klienten: BankID
-- ELLER angivet personnummer. Databasen kan inte läsa
-- NEXT_PUBLIC_BANKID_ENABLED, som är en byggtidsflagga i webbläsaren.
-- NÄR BANKID ÄR SKARPT: ta bort or-grenen på den märkta raden.
-- ---------------------------------------------------------------------------
create or replace function public.dealer_may_bid(p_dealer uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.profiles p
     where p.id = p_dealer
       and p.role = 'dealer'
       and p.approved = true
       and p.suspended = false
       -- Identitetskravet. Ta bort or-grenen nar BankID ar skarpt.
       and (p.identity_verified is true
            or (p.personal_number is not null and btrim(p.personal_number) <> ''))
  );
$$;

-- Predikatet måste gå att köra av den inloggade användaren, annars kan policyn
-- nedan inte utvärderas. Det är en ren läsning som bara svarar ja eller nej,
-- och lämnar inget ut.
grant execute on function public.dealer_may_bid(uuid) to authenticated;

-- Endast godkända handlare får buda, och bara på aktiva auktioner vars
-- sluttid inte passerat. Stoppar bud efter auktionens slut på servernivå.
drop policy if exists "dealers can bid" on public.bids;
create policy "dealers can bid" on public.bids
  for insert with check (
    public.dealer_may_bid(auth.uid())
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
declare
  v_top bigint;
begin
  -- Serialisera samtidiga bud på SAMMA föremål: utan lås är kontrollen nedan
  -- ett check-then-insert (TOCTOU) där två parallella bud båda kan läsa samma
  -- max() och båda passera. Ett transaktionslås per item gör budet atomiskt.
  perform pg_advisory_xact_lock(hashtext(new.item_id::text)::bigint);
  v_top := coalesce((select max(amount) from public.bids where item_id = new.item_id), 0);
  if v_top = 0 then
    -- Öppningsbud: bara positivt belopp krävs.
    if new.amount <= 0 then
      raise exception 'Budet måste vara ett positivt belopp.';
    end if;
  elsif new.amount < v_top + 100 then
    -- Minsta höjning 100 kr, server-side (matchar UI). Stänger +1 kr-nudge som
    -- annars kunde hålla auktionen öppen billigt via anti-sniping.
    raise exception 'Budet måste vara minst % kr (minsta höjning 100 kr).', v_top + 100;
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
    and public.dealer_may_bid(auth.uid())
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
       -- Samma predikat som budpolicyn, inklusive identitetskravet: ett
       -- autobud som lades innan kravet fanns ska inte kunna losa ut ett bud
       -- fran en handlare som inte far buda idag.
       where ab.item_id = p_item and public.dealer_may_bid(ab.dealer_id)
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
-- Användaren godkänner villkoren vid registrering (kryssruta). Tidsstämpeln
-- sparas för spårbarhet på vilken version som accepterades. Handlare godkänner
-- handlarvillkoren, privatpersoner de allmänna användarvillkoren.
alter table public.profiles add column if not exists dealer_terms_accepted_at timestamptz;
alter table public.profiles add column if not exists customer_terms_accepted_at timestamptz;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
  set search_path = public as $$
begin
  insert into public.profiles (
    id, email, full_name, role, company_name, approved,
    phone, personal_number, address, postal_code, city, org_number,
    dealer_terms_accepted_at, customer_terms_accepted_at
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
    new.raw_user_meta_data->>'org_number',
    case when new.raw_user_meta_data->>'role' = 'dealer'
      then (new.raw_user_meta_data->>'dealer_terms_accepted_at')::timestamptz else null end,
    case when new.raw_user_meta_data->>'role' <> 'dealer'
      then (new.raw_user_meta_data->>'customer_terms_accepted_at')::timestamptz else null end
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
  -- Bara en körning åt gången: om en tidigare körning överlappar sitt
  -- minutfönster hoppar den nya över, så samma avslut inte notifieras dubbelt.
  -- Transaktions-scoped lås släpps automatiskt när körningen är klar.
  if not pg_try_advisory_xact_lock(hashtext('settle_ended_auctions')::bigint) then
    return;
  end if;
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
              ' kr. Godkänn budet så drar vi igång affären. Vi betalar ut omgående via Swish eller ' ||
              'bankkonto så snart vi tagit emot och verifierat föremålet. Att sälja är helt kostnadsfritt för dig.',
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

-- Handlarens inbetalning: leverantörsagnostisk referens + status för
-- handlarens inbetalning. dealer_paid_at sätts automatiskt när callbacken
-- bekräftar en lyckad betalning; admin kan fortfarande sätta den manuellt.
alter table public.orders add column if not exists payment_provider text;
alter table public.orders add column if not exists payment_reference text;
alter table public.orders add column if not exists payment_status text; -- 'pending' | 'paid' | 'failed'
-- Retur/kreditering: när ett föremål inte godkänns vid kontroll (fake/stämmer ej).
alter table public.orders add column if not exists refunded_at timestamptz;
alter table public.orders add column if not exists refund_reason text;
-- Säkerhetsförsegling: numret på den förseglade säkerhetspåsen. Registreras av
-- admin och visas för båda parter så ingen kan byta ut föremålet under transport.
alter table public.orders add column if not exists seal_number text;
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
            'Budet är accepterat och affären är din. Så fort du godkänt ditt slutpris skickar vi dig ett kostnadsfritt, rekommenderat brev med förbetalt porto, försäkrat upp till 100 000 kr. Lägg föremålet i det och posta det rekommenderat, porto och adress är redan klara. Så snart vi tagit emot och verifierat det betalar vi ut omgående via Swish eller bankkonto.',
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

-- Motparten till accept: säljaren tackar nej. Föremålet blir 'closed' UTAN
-- accepterat bud, så ingen affär skapas. Utan den här notisen tystnar det bara
-- för handlaren som låg högst, och hen får aldrig veta att affären inte blev av.
--
-- Fanns bara i databasen fram till 2026-08-30, skriven direkt i Supabase och
-- aldrig införd i den här filen. Texten nedan är hämtad ur den skarpa databasen
-- med pg_get_functiondef, inte omskriven.
create or replace function public.notify_bid_declined()
returns trigger language plpgsql security definer
set search_path = public as $$
declare
  v_dealer uuid;
begin
  if new.status = 'closed' and new.accepted_bid_id is null
     and old.status is distinct from 'closed' then
    select dealer_id into v_dealer
    from public.bids
    where item_id = new.id
    order by amount desc, created_at asc
    limit 1;

    if v_dealer is not null then
      insert into public.notifications (user_id, title, message, item_id, link)
      values (v_dealer, 'Säljaren tackade nej till budet',
              'Säljaren valde att inte sälja "' || new.title || '". Ditt bud gick tyvärr inte igenom den här gången. Håll utkik, föremålet kan dyka upp igen.',
              new.id, '/auctions/' || new.id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_bid_declined on public.items;
create trigger on_bid_declined
  after update on public.items
  for each row execute procedure public.notify_bid_declined();

-- SÄKERHET: acceptera bara ett bud som faktiskt hör till föremålet. accepted_bid_id
-- saknar FK och ägar-policyn tillåter att sätta status='closed' + valfritt bud-id.
-- Utan denna spärr kan en ägare PATCH:a in ett bud-id från en ANNAN auktion (bud-id
-- är publikt läsbara) och skapa en affär mot en handlare som aldrig budat, som sedan
-- stängs av automatiskt för utebliven betalning. Kör som BEFORE så den blockerar
-- innan notify_bid_accepted (AFTER) skapar affären.
create or replace function public.enforce_accepted_bid_valid()
returns trigger language plpgsql
  set search_path = public as $$
declare
  v_amount bigint;
  v_top_id uuid;
begin
  if new.accepted_bid_id is not null
     and new.accepted_bid_id is distinct from old.accepted_bid_id then
    -- Får inte byta accepterat bud i efterhand (ordern är redan skapad).
    if old.accepted_bid_id is not null then
      raise exception 'Det accepterade budet kan inte ändras.';
    end if;
    -- Budet måste tillhöra föremålet ...
    select b.amount into v_amount
      from public.bids b where b.id = new.accepted_bid_id and b.item_id = new.id;
    if v_amount is null then
      raise exception 'Det accepterade budet tillhör inte detta föremål.';
    end if;
    -- ... och vara det vinnande (högsta) budet. Samma tie-break som avräkningen
    -- (högsta belopp, äldst först), så en säljare inte kan tvinga fram en order
    -- till ett lägre kompisbud och därmed även auto-avstänga andra budgivare.
    select b.id into v_top_id
      from public.bids b where b.item_id = new.id
      order by b.amount desc, b.created_at asc
      limit 1;
    if v_top_id is distinct from new.accepted_bid_id then
      raise exception 'Endast det högsta budet kan accepteras.';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists on_item_accept_validate on public.items;
create trigger on_item_accept_validate
  before update on public.items
  for each row execute procedure public.enforce_accepted_bid_valid();

-- Notis när admin flyttar affären till nästa steg.
create or replace function public.notify_order_status()
returns trigger language plpgsql security definer
  set search_path = public as $$
declare
  v_title text;
begin
  select title into v_title from public.items where id = new.item_id;
  if new.status is distinct from old.status then
    -- Dedupe: skicka bara milstolpsnotisen om den inte redan finns för samma
    -- mottagare/affär/titel. En återöppnad affär (reopenOrder) som avancerar på
    -- nytt skulle annars dubbel-mejla t.ex. utbetalning + Trustpilot-inbjudan.
    if new.status = 'received' then
      insert into public.notifications (user_id, title, message, item_id, link)
      select new.seller_id, 'Vi har tagit emot ditt föremål',
              'Vi har tagit emot "' || v_title || '" och äkthetskontrollerar det nu. Så snart kontrollen är godkänd betalar vi ut ' ||
              replace(to_char(new.amount, 'FM999,999,999'), ',', ' ') || ' kr omgående via Swish eller bankkonto. Fyll gärna i dina utbetalningsuppgifter i din profil så går det snabbt.',
              new.item_id, '/orders/' || new.id
      where not exists (select 1 from public.notifications n
        where n.user_id = new.seller_id and n.link = '/orders/' || new.id and n.title = 'Vi har tagit emot ditt föremål');
      insert into public.notifications (user_id, title, message, item_id, link)
      select new.dealer_id, 'Ditt föremål är mottaget och kontrollerat',
              '"' || v_title || '" är mottaget hos oss och äkthetskontrollerat. Vi packar och skickar det vidare till dig.',
              new.item_id, '/orders/' || new.id
      where not exists (select 1 from public.notifications n
        where n.user_id = new.dealer_id and n.link = '/orders/' || new.id and n.title = 'Ditt föremål är mottaget och kontrollerat');
    elsif new.status = 'verified_paid' then
      insert into public.notifications (user_id, title, message, item_id, link)
      select new.seller_id, 'Du har fått betalt',
              replace(to_char(new.amount, 'FM999,999,999'), ',', ' ') || ' kr betalas ut omgående via Swish eller bankkonto. Tack för att du sålde via GuldBud!',
              new.item_id, '/orders/' || new.id
      where not exists (select 1 from public.notifications n
        where n.user_id = new.seller_id and n.link = '/orders/' || new.id and n.title = 'Du har fått betalt');
    elsif new.status = 'shipped_to_dealer' then
      insert into public.notifications (user_id, title, message, item_id, link)
      select new.dealer_id, 'Ditt föremål är på väg',
              'Vi har skickat "' || v_title || '" till dig. Tack för ditt köp via GuldBud. Hör av dig i affären om du undrar något.',
              new.item_id, '/orders/' || new.id
      where not exists (select 1 from public.notifications n
        where n.user_id = new.dealer_id and n.link = '/orders/' || new.id and n.title = 'Ditt föremål är på väg');
    elsif new.status = 'completed' then
      insert into public.notifications (user_id, title, message, item_id, link)
      select new.seller_id, 'Tack för din affär!',
              'Affären för "' || v_title || '" är helt klar. Tack för att du sålde via GuldBud, vi hoppas att vi ses igen.',
              new.item_id, '/orders/' || new.id
      where not exists (select 1 from public.notifications n
        where n.user_id = new.seller_id and n.link = '/orders/' || new.id and n.title = 'Tack för din affär!');
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

-- Dödkod: äldre budnotiser som ersattes av notify_new_bid. Ingen trigger pekar
-- på dem, kontrollerat mot pg_trigger 2026-08-30, men funktionerna låg kvar i
-- den skarpa databasen. notify_on_bid saknade dessutom kontrollen av att ägaren
-- inte själv är budgivaren, som den nya har.
drop function if exists public.notify_on_bid();
drop function if exists public.notify_on_outbid();

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
  -- Bara en körning åt gången (transaktions-scoped, auto-släpps), så en
  -- överlappande cron-körning inte skickar dubbla påminnelser/avstängningar.
  if not pg_try_advisory_xact_lock(hashtext('process_unpaid_orders')::bigint) then
    return;
  end if;
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

-- ============================================================
-- Förmedlingsuppdraget. Säljaren godkänner villkoren vid registrering, och
-- villkoren bär uppdraget. Publiceringen av föremålet ÄR instruktionen, så
-- ingen separat signering behövs. Det som krävs är en notering per föremål:
-- när uppdraget lämnades och vilken lydelse av villkoren som då gällde.
--
-- terms_version är det som bär hela lösningen. Villkorstexten ändras över
-- tid, och utan versionen går det inte att i efterhand visa vad en viss
-- säljare faktiskt godkände. Med den kan uppdragskvittot renderas exakt som
-- villkoren löd den dagen.
-- ============================================================
alter table public.items add column if not exists mandate_accepted_at timestamptz;
alter table public.items add column if not exists terms_version text;

-- AML-data i EGEN tabell, inte som kolumner på orders. Skäl: RLS är radnivå,
-- så parternas "läs egen order"-policy exponerar annars hela raden inklusive
-- admins granskningsanteckningar (en part kunde läsa AML-utredningen mot sig
-- själv). order_aml är admin-only. status: 'clear' = ok, 'review' = kräver
-- granskning, 'approved' = godkänd, 'flagged' = misstänkt (utbetalning spärrad).
create table if not exists public.order_aml (
  order_id uuid primary key references public.orders(id) on delete cascade,
  aml_status text not null default 'clear',
  aml_flag_reason text,
  aml_reviewed_by uuid references public.profiles,
  aml_reviewed_at timestamptz,
  aml_notes text,
  admin_notes text
);
alter table public.order_aml enable row level security;
drop policy if exists "admins manage order_aml" on public.order_aml;
create policy "admins manage order_aml" on public.order_aml
  for all using (public.is_admin()) with check (public.is_admin());

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
  v_status text;
  v_reason text;
  v_title text;
begin
  -- AFTER INSERT: den nya ordern finns nu, exkludera den ur summan.
  select coalesce(sum(amount), 0) into v_prior
  from public.orders
  where seller_id = new.seller_id
    and status <> 'cancelled'
    and id <> new.id
    and created_at > now() - interval '12 months';

  if new.amount >= v_single then
    v_status := 'review';
    v_reason := 'Enskild affär över ' || v_single || ' kr';
  elsif v_prior + new.amount >= v_cumulative then
    v_status := 'review';
    v_reason := 'Sammanlagd volym över ' || v_cumulative || ' kr på 12 mån';
  else
    v_status := 'clear';
  end if;

  insert into public.order_aml (order_id, aml_status, aml_flag_reason)
  values (new.id, v_status, v_reason)
  on conflict (order_id) do nothing;

  -- Notis till admin om affären kräver granskning (tidigare egen trigger).
  if v_status = 'review' then
    select title into v_title from public.items where id = new.item_id;
    insert into public.notifications (user_id, title, message, item_id, link)
    select p.id,
           'Affär att granska (rutinkontroll)',
           'Affären för "' || coalesce(v_title, 'föremål') || '" behöver en snabb granskning innan utbetalning: ' ||
             coalesce(v_reason, 'högre belopp') || '.',
           new.item_id,
           '/admin/orders/' || new.id
    from public.profiles p
    where p.role = 'admin';
  end if;
  return new;
end;
$$;

drop trigger if exists on_order_set_aml on public.orders;
create trigger on_order_set_aml
  after insert on public.orders
  for each row execute procedure public.set_order_aml_status();

-- Utbetalningsspärr utökad: släpp aldrig pengar (verified_paid/shipped_to_dealer)
-- medan AML-granskning pågår eller affären är flaggad. Befintliga rader har
-- aml_status = null och påverkas inte.
create or replace function public.enforce_payment_before_release()
returns trigger language plpgsql security definer
set search_path = public as $$
declare
  v_aml text;
begin
  if new.status in ('verified_paid', 'shipped_to_dealer') and new.dealer_paid_at is null then
    raise exception 'Handlarens betalning måste registreras (dealer_paid_at) innan utbetalning eller vidareskick.';
  end if;
  if new.status in ('verified_paid', 'shipped_to_dealer') then
    select aml_status into v_aml from public.order_aml where order_id = new.id;
    if v_aml is not null and v_aml not in ('clear', 'approved') then
      raise exception 'AML-granskning krävs innan utbetalning (aml_status=%).', v_aml;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists on_order_release_guard on public.orders;
create trigger on_order_release_guard
  before update on public.orders
  for each row execute procedure public.enforce_payment_before_release();

-- (AML-granskningsnotisen är hopslagen i set_order_aml_status ovan, som nu
-- körs AFTER INSERT och både beräknar status och notifierar admin.)
drop trigger if exists on_order_aml_review on public.orders;

-- ============================================================
-- "Snart slut" till budgivare. ~10 min före avslut får varje handlare som
-- budat men INTE leder just nu en påminnelse (mejl + notis) om att höja.
-- Den enda notisen som verkligen är värd ett mejl: sista chansen att ta
-- ledningen. Ledaren slipper (behöver inte agera). En gång per auktion.
-- ============================================================
alter table public.items add column if not exists bidders_ending_notified boolean not null default false;

create or replace function public.notify_bidders_ending_soon()
returns void language plpgsql security definer
  set search_path = public as $$
declare
  r record;
  v_leader uuid;
begin
  for r in
    select i.* from public.items i
    where i.status = 'active'
      and i.auction_ends_at is not null
      and i.auction_ends_at > now()
      and i.auction_ends_at <= now() + interval '10 minutes'
      and i.bidders_ending_notified = false
  loop
    -- Nuvarande ledande handlare (högsta bud) exkluderas.
    select dealer_id into v_leader
    from public.bids where item_id = r.id
    order by amount desc limit 1;

    insert into public.notifications (user_id, title, message, item_id, link)
    select distinct b.dealer_id,
           'Snart slut – du är överbjuden',
           '"' || r.title || '" avslutas inom 10 minuter och du är inte högsta bud just nu. Höj ditt bud för att ta ledningen innan det är för sent.',
           r.id,
           '/auctions/' || r.id
    from public.bids b
    where b.item_id = r.id
      and b.dealer_id is distinct from v_leader;

    update public.items set bidders_ending_notified = true where id = r.id;
  end loop;
end; $$;

do $$
begin
  create extension if not exists pg_cron;
  perform cron.unschedule('notify-bidders-ending-soon') from cron.job where jobname = 'notify-bidders-ending-soon';
  perform cron.schedule('notify-bidders-ending-soon', '* * * * *', 'select public.notify_bidders_ending_soon();');
exception when others then
  raise notice 'pg_cron ej konfigurerat för notify-bidders-ending-soon: %', sqlerrm;
end $$;

-- ============================================================
-- Prestanda-index för de hetaste filtren och sorteringarna. Utan dessa gör
-- handlar-/kundvyer och budläggning sekventiell scan som växer linjärt med
-- tabellstorleken. Ligger sist så alla tabeller garanterat finns, och är
-- idempotenta (if not exists) så blocket kan köras på en befintlig databas.
-- ============================================================
-- Handlarens egna bud (dealer/dashboard, profil, "mina bud"). bids är den
-- tabell som växer snabbast, så detta är den viktigaste indexeringen.
create index if not exists bids_dealer_id_idx on public.bids (dealer_id);
-- Högsta bud + enforce_bid_higher: max(amount) / order by amount desc per item.
create index if not exists bids_item_amount_idx on public.bids (item_id, amount desc);
-- Kundens egna föremål (my-items, startsidans "mina föremål", accept-flödet).
create index if not exists items_owner_id_idx on public.items (owner_id);
-- Aktiva auktioner sorterade på sluttid (startsidan, /auctions, dashboarden).
-- Partiellt på status='active' så indexet hålls litet och träffar den heta frågan
-- "status=active and auction_ends_at > now() order by auction_ends_at".
create index if not exists items_active_ends_idx on public.items (auction_ends_at) where status = 'active';
-- Handlarens auto-bud per handlare (dashboard läser auto_bids where dealer_id).
create index if not exists auto_bids_dealer_id_idx on public.auto_bids (dealer_id);
-- notify_ending_soon slår upp watchlist per item_id, men PK börjar på dealer_id.
create index if not exists watchlist_item_id_idx on public.watchlist (item_id);

-- ============================================================
-- Aktiva auktioner med budstatistik i EN query. Ersätter mönstret "hämta alla
-- aktiva items, hämta alla deras bud med .in(id-lista), aggregera i JS" som
-- annars spricker på URL-längd (414) vid många auktioner. Aggregeringen sker i
-- databasen via lateral join (träffar bids_item_amount_idx).
-- SECURITY INVOKER (default) så RLS gäller fullt ut: anon får redan läsa aktiva
-- items och deras bud, så funktionen är trygg att exponera. Returnerar hela
-- item-raden som jsonb + top_bid + bid_count. min_price ingår (RLS är radnivå);
-- servern skalar bort den innan payloaden når klienten, precis som tidigare.
-- ============================================================
create or replace function public.active_items_with_stats()
returns setof jsonb
language sql stable
set search_path = public
as $$
  -- source_note (fritext om ursprung, kan innehålla personligt) skalas bort ur
  -- den publika payloaden. Bara admin/ägare ska se den.
  select (to_jsonb(i) - 'source_note') || jsonb_build_object(
           'top_bid', coalesce(b.top_bid, 0),
           'bid_count', coalesce(b.bid_count, 0)
         )
  from public.items i
  left join lateral (
    select max(amount)::int as top_bid, count(*)::int as bid_count
    from public.bids
    where item_id = i.id
  ) b on true
  where i.status = 'active'
    and (i.auction_ends_at is null or i.auction_ends_at > now())
  order by i.auction_ends_at asc nulls last;
$$;

-- ============================================================
-- Admin-KPI: snittbud per objekt, aggregerat server-side i EN query i stället
-- för att hämta alla items + alla deras bud med .in(id-lista) (som växer med
-- HELA historiken och spricker på URL-längd). SECURITY DEFINER + is_admin-koll
-- så den bara kan läsas av admin (annars skulle marknadsstatistiken vara publik).
-- ============================================================
create or replace function public.bid_kpi_summary()
returns table (objects int, total_bids int, zero_one int, three_plus int, live_starving int)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Endast admin.';
  end if;
  return query
  with per_item as (
    select i.id, i.status, count(b.id) as n
    from public.items i
    left join public.bids b on b.item_id = i.id
    where i.status in ('active', 'closed')
    group by i.id, i.status
  )
  select
    count(*)::int,
    coalesce(sum(n), 0)::int,
    count(*) filter (where n <= 1)::int,
    count(*) filter (where n >= 3)::int,
    count(*) filter (where status = 'active' and n <= 1)::int
  from per_item;
end;
$$;

-- ---------------------------------------------------------------------------
-- Defense-in-depth: underhålls-RPC:er ska inte gå att anropa direkt via
-- PostgREST av vanliga användare. De körs av pg_cron (jobbägaren) och av
-- security-definer-triggers, så att återkalla exec från anon/authenticated
-- påverkar inte den schemalagda driften, bara direktanrop.
-- ---------------------------------------------------------------------------
revoke execute on function public.settle_ended_auctions() from anon, authenticated;
revoke execute on function public.process_unpaid_orders() from anon, authenticated;
revoke execute on function public.resolve_auto_bids(uuid) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Listningskraven, flyttade från klienten till databasen.
--
-- Kravet på identitet, ägarintyg och förmedlingsuppdrag fanns tidigare bara i
-- app/customer/submit/page.tsx. Policyn "owner manages own items" kräver bara
-- ägarskap och status pending, och kolumnerna är nullable. Ett anrop direkt
-- mot PostgREST med säljarens egen session kunde alltså skapa ett föremål helt
-- utan den rättsliga konstruktionen: inget uppdrag, ingen villkorsversion,
-- inget ägarintyg och ingen identitet. Föremålet hamnade i admins
-- granskningskö och såg ut som vilket annat som helst.
--
-- Två medvetna avgränsningar:
--
-- 1. INSERT kräver att uppgifterna finns. UPDATE kräver dem inte, men
--    förbjuder att ett satt värde nollas. Skälet är att föremål som skapades
--    innan kolumnerna fanns har null, och de ska fortfarande gå att godkänna,
--    avsluta och sälja. Nya rader kan inte skapas utan uppgifterna, gamla kan
--    inte tömmas på dem.
--
-- 2. Identitetskravet speglar klienten: verifierad med BankID ELLER ett
--    angivet personnummer. Databasen kan inte läsa NEXT_PUBLIC_BANKID_ENABLED,
--    som är en byggtidsflagga i webbläsaren. När BankID är skarpt skärps
--    kravet genom att ta bort or-grenen på raden som är märkt nedan.
--
-- Adress och utbetalningsuppgifter kontrolleras INTE här. De behövs först vid
-- utbetalning, och den vägen har redan sin spärr i
-- enforce_payment_before_release. Klientgrinden samlar in dem vid listning.
--
-- security definer behövs för att läsningen av profiles ska vara deterministisk
-- oavsett vem som skriver. Kontrollen är skriven fail-closed: hittas ingen
-- profil blockeras insert.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_listing_requirements()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_identity_ok boolean;
begin
  if tg_op = 'INSERT' then
    if new.mandate_accepted_at is null
       or new.terms_version is null
       or btrim(new.terms_version) = '' then
      raise exception 'Formedlingsuppdraget saknas: mandate_accepted_at och terms_version kravs vid publicering.';
    end if;

    if new.ownership_attested_at is null then
      raise exception 'Agarintyget saknas: ownership_attested_at kravs vid publicering.';
    end if;

    if new.source_type is null
       or new.source_type not in ('eget_smycke', 'arv', 'eget_kop', 'annat') then
      raise exception 'Ursprungsdeklarationen saknas eller ar ogiltig (source_type=%).',
        coalesce(new.source_type, 'null');
    end if;

    -- Identitetskravet. Ta bort or-grenen nar BankID ar skarpt.
    select (p.identity_verified is true)
        or (p.personal_number is not null and btrim(p.personal_number) <> '')
      into v_identity_ok
      from public.profiles p
     where p.id = new.owner_id;

    if v_identity_ok is not true then
      raise exception 'Saljaren ar inte identifierad: BankID eller personnummer kravs innan ett foremal kan laggas ut.';
    end if;

    return new;
  end if;

  -- UPDATE: gamla rader slipper kravet, men uppgifterna far aldrig raderas.
  if old.mandate_accepted_at is not null and new.mandate_accepted_at is null then
    raise exception 'mandate_accepted_at kan inte tas bort fran ett foremal.';
  end if;
  if old.terms_version is not null and new.terms_version is null then
    raise exception 'terms_version kan inte tas bort fran ett foremal.';
  end if;
  if old.ownership_attested_at is not null and new.ownership_attested_at is null then
    raise exception 'ownership_attested_at kan inte tas bort fran ett foremal.';
  end if;
  if old.source_type is not null and new.source_type is null then
    raise exception 'source_type kan inte tas bort fran ett foremal.';
  end if;

  return new;
end;
$$;

drop trigger if exists on_item_listing_requirements on public.items;
create trigger on_item_listing_requirements
  before insert or update on public.items
  for each row execute procedure public.enforce_listing_requirements();


-- ===========================================================================
-- Identitet: ett personnummer hör till ett konto
--
-- Penningtvättströskeln i set_order_aml_status räknas kumulativt per konto
-- över 12 månader. Utan den här spärren kan samma person verifiera obegränsat
-- många konton med samma BankID och sprida sina affärer över dem, varpå den
-- kumulativa tröskeln aldrig slår till. Spärren är alltså inte städning, den
-- är det som gör den rullande tröskeln meningsfull.
--
-- Partiellt index: rader utan verified_ssn (alla som inte kört BankID) berörs
-- inte, och null räknas ändå aldrig som lika med null i ett unikt index.
--
-- Personnumret lagras normaliserat till tolv siffror av callbacken
-- (lib/identity.ts). Utan normaliseringen hade 900101-1234 och 199001011234
-- varit två olika strängar och indexet hade inte hindrat något.
-- ===========================================================================

-- Kör den här först om indexet vägrar skapas. Den visar vilka personnummer som
-- redan finns på fler än ett konto, och de måste redas ut för hand.
--   select verified_ssn, count(*), array_agg(id)
--   from public.profiles
--   where verified_ssn is not null
--   group by verified_ssn having count(*) > 1;

create unique index if not exists profiles_verified_ssn_unique
  on public.profiles (verified_ssn)
  where verified_ssn is not null;


-- ===========================================================================
-- Logg över utlämnad säljaridentitet
--
-- Säljaren är privatperson och anonym överallt utom mot den handlare som
-- faktiskt köpt föremålet. Varje gång namn, personnummer och adress lämnar
-- servern skrivs en rad här, av lib/identityRelease via servicerollen.
-- Rutterna lämnar inte ut något om raden inte gick att skriva.
--
-- Syftet är dubbelt: att kunna svara en säljare som frågar vem som tagit del
-- av uppgifterna, och att se om en handlare hämtar identiteter i en takt som
-- inte hör ihop med deras affärer.
-- ===========================================================================
create table if not exists public.identity_disclosures (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders on delete cascade,
  seller_id uuid references public.profiles on delete set null,
  requested_by uuid references public.profiles on delete set null,
  requester_role text not null check (requester_role in ('admin', 'dealer')),
  channel text not null check (channel in ('seller_api', 'invoice_pdf')),
  created_at timestamptz not null default now()
);

create index if not exists identity_disclosures_order_idx
  on public.identity_disclosures (order_id);
create index if not exists identity_disclosures_seller_idx
  on public.identity_disclosures (seller_id, created_at desc);
create index if not exists identity_disclosures_requester_idx
  on public.identity_disclosures (requested_by, created_at desc);

alter table public.identity_disclosures enable row level security;

-- Ingen klient skriver hit. Servicerollen går förbi RLS, och den är enda
-- vägen in. Bara admin läser: loggen visar vem som hämtat vems personnummer
-- och är i sig känslig.
drop policy if exists "admin reads identity disclosures" on public.identity_disclosures;
create policy "admin reads identity disclosures" on public.identity_disclosures
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
