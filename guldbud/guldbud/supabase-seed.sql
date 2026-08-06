-- ============================================================
-- GuldBud – Demo-föremål (seed)
-- Fyller startsidan med några realistiska exempel-auktioner.
-- Kör i Supabase > SQL Editor. Säker att köra flera gånger:
-- föremål med samma namn läggs inte till på nytt.
--
-- Föremålen ägs av det först skapade kontot (troligen ditt).
-- Radera dem när som helst i Table Editor > items.
-- ============================================================

-- Lägg till demo-föremålen (hoppar över de som redan finns)
insert into public.items
  (owner_id, title, category, description, weight_grams, karat, diamond_carat, gemstone, min_price, status, auction_ends_at)
select owner_id, title, category, description, weight_grams, karat, diamond_carat, gemstone, min_price, 'active', ends_at
from (
  select
    (select id from public.profiles order by created_at limit 1) as owner_id,
    d.title, d.category, d.description, d.weight_grams, d.karat,
    d.diamond_carat, d.gemstone, d.min_price,
    now() + (d.hours || ' hours')::interval as ends_at
  from (values
    ('Vigselring i rödguld',        'Ringar',    'Klassisk slät vigselring i 18K rödguld. Fint skick, lätt patina.',        4.2,  '18K / 750', null,  null,       null,  8),
    ('Ankarlänk i gult guld',       'Halsband',  'Kraftig ankarlänk, 50 cm. Stämplad och kontrollerad.',                     22.5, '18K / 750', null,  null,       18000, 16),
    ('Diamantörhängen, par',        'Örhängen',  'Ett par örhängen i vitguld med briljantslipade diamanter.',                3.1,  '18K / 750', 0.50,  'Diamant',  null,  22),
    ('Hänge med blå safir',         'Hängen',    'Elegant hänge i 14K guld med infattad safir.',                             5.4,  '14K / 585', null,  'Safir',    null,  30),
    ('Guldmynt, Krugerrand 1 oz',   'Mynt',      'Investeringsmynt i 22K guld, 1 troy ounce. Utmärkt skick.',                 33.9, '22K / 916', null,  null,       38000, 40),
    ('Bismarcklänk armband',        'Armband',   'Tungt bismarckarmband, 21 cm. Stämplat 750.',                              18.7, '18K / 750', null,  null,       null,  52),
    ('Antik brosch med pärla',      'Broscher',  'Sekelskiftesbrosch i guld med odlad pärla. Samlarobjekt.',                  9.3,  '18K / 750', null,  'Pärla',    null,  68),
    ('Solitärring med diamant',     'Ringar',    'Solitärring i vitguld med centralt infattad diamant, ca 1 carat.',         3.8,  '18K / 750', 1.00,  'Diamant',  15000, 90)
  ) as d(title, category, description, weight_grams, karat, diamond_carat, gemstone, min_price, hours)
) as rows
where owner_id is not null
  and not exists (select 1 from public.items i where i.title = rows.title);

-- Lägg några startbud om det finns en godkänd handlare (annars hoppas det över)
do $$
declare
  v_dealer uuid;
  v_item record;
  v_base integer;
begin
  select id into v_dealer from public.profiles
    where role = 'dealer' and approved = true order by created_at limit 1;
  if v_dealer is null then
    raise notice 'Ingen godkänd handlare hittad – hoppar över demo-bud.';
    return;
  end if;

  for v_item in
    select id, weight_grams from public.items
    where status = 'active' order by auction_ends_at limit 4
  loop
    v_base := greatest(500, round(coalesce(v_item.weight_grams, 5) * 880));
    insert into public.bids (item_id, dealer_id, amount)
    values (v_item.id, v_dealer, v_base)
    on conflict do nothing;
    insert into public.bids (item_id, dealer_id, amount)
    values (v_item.id, v_dealer, v_base + 350)
    on conflict do nothing;
  end loop;
end $$;
