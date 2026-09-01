# GuldBud

Marknadsplats där privatpersoner säljer begagnat guld till verifierade
handlare. GuldBud är förmedlare och äger aldrig guldet.

---

## Regel 1: anta aldrig, hitta aldrig på

**Detta är den viktigaste regeln i filen. Den gäller före allt annat.**

Påstå ingenting du inte har kontrollerat. Varje faktapåstående ska ha en källa,
och källan ska vara en av dessa:

1. Kod, schema eller konfiguration du precis har läst i det här repot
2. Något användaren själv har sagt i konversationen
3. En körning eller ett verktygsanrop du faktiskt har gjort och sett utfallet av

Har du ingen sådan källa: **fråga, eller skriv att du inte vet.** Aldrig något
däremellan. En rimlig gissning som låter säker är värre än ett ärligt "jag vet
inte", eftersom den går vidare till dokument, revisorer och myndigheter.

### Det här gäller särskilt

- **Affärsfakta finns oftast inte i koden.** Bankkonton, avtal, priser hos
  leverantörer, vad bolaget har registrerat, vad någon har bestämt. Koden kan
  inte svara på sådant. Fråga.
- **Läs vidare till källan.** Hittar du något som ser ut att svara på frågan,
  kontrollera att det verkligen är regeln och inte en engångsmigrering, ett
  gammalt värde eller en kommentar som inte längre stämmer.
- **Uppskattningar ska märkas som uppskattningar.** Skriv aldrig ett antagande
  som om det vore mätt.
- **Gamla dokument är inte källor.** Koden och den publicerade sajten gäller.

Kan du inte verifiera något på grund av miljön, till exempel en blockerad
proxy, säg det rakt ut i stället för att fylla luckan.

### Så hanterar du en lucka

Stanna inte upp direkt. **Gör klart allt som går att verifiera**, markera
luckan tydligt i leveransen, och samla frågorna sist i svaret. Användaren ska
få det som går att leverera, plus en tydlig lista över vad som saknar svar.

Undantaget är när ett antagande skulle göra hela arbetet fel eller riskabelt.
Då frågar du innan du bygger vidare.

---

## Checklista före du säger att något är klart

Gå igenom den här varje gång, inte bara när det känns osäkert.

- [ ] `npx tsc --noEmit` är rent
- [ ] `npm run build` kompilerar
- [ ] Varje faktapåstående i svaret har en källa enligt regel 1
- [ ] Inga tankstreck någonstans, varken i kod, dokument eller svar
- [ ] Bara det som efterfrågades är ändrat, inget annat
- [ ] Ändringen är committad och pushad
- [ ] Det du inte kunde verifiera står utskrivet, inte utelämnat

Säg aldrig att något är verifierat när du bara har läst koden. Läst kod visar
vad som är skrivet, inte att det fungerar. Det finns inga automatiska tester
i projektet, så ett flöde är bevisat först när någon klickat igenom det.

---

## Kräver uttrycklig instruktion

Rör inte det här på eget initiativ, ens om något ser fel ut. Påpeka i stället
och fråga.

- `lib/fees.ts`, avgifts- och momsmodellen. Ett fel här ger fel i varje
  faktura och varje utbetalning.
- De tre dokumenten: `app/orders/[id]/invoice/page.tsx` och
  `lib/pdf/invoiceDoc.tsx`. Formuleringarna bär förmedlarrollen juridiskt.
- Villkorstexterna: `app/terms/page.tsx` och `app/handlarvillkor/`.
- Spärrarna i `supabase-schema.sql` som blockerar utbetalning före betalning
  och före godkänd penningtvättsgranskning.
- Miljövariabler och allt som rör nycklar.

---

## Affärsfakta

Sådant som inte går att läsa ur koden. Står det OBEKRÄFTAT här ska du fråga,
aldrig gissa.

**Bolaget, så som det ser ut i registret idag**

- Namn: **Hey Consulting Nordic AB**
- Org.nr: **559291-4781**
- Registrerad adress: **Kvarnvingevägen 2, 177 41 Järfälla**
- Momsregistrerat, SE559291478101, bekräftat mot Skatteverket
- SNI-koden är ändrad till **47.910, Förmedling**. Klart.

**Vad som ligger i handläggning**

- Namnbyte till **GuldBud AB**. Inskickat, väntar på Verksamt.
- Byte av adress till postboxen. Inskickat, väntar på Verksamt.
- Adressen och nycklarna är mottagna från PostNord, men registerändringen är
  inte genomförd.

Fram till att båda gått igenom heter bolaget Hey Consulting Nordic AB med
adress i Järfälla. **Påstå aldrig att namnbytet eller adressbytet är klart.**

**Beslutat: det ska stå GuldBud AB överallt.**

Användaren har bestämt det, och ändrade beslutet 2026-08-31 efter att tidigare
ha delat upp det. Alla dokument i repot skrivs för **GuldBud AB, org.nr
559291-4781**. Det gäller villkoren, förmedlingsuppdraget, fakturadokumenten och
penningtvättsrutinen, alltså även handlingar som går till utomstående.
Användaren bekräftade 2026-08-31 att det gäller **även uppgifter till
leverantörer**, inte bara dokumenten i repot.

**Rätta alltså aldrig ett dokument till Hey Consulting Nordic AB.** Det gjordes
en gång i PR #281 och revertades i PR #282.

Det som fortfarande gäller om registret: bolaget heter Hey Consulting Nordic AB
där tills Verksamt är klart, och det får aldrig påstås att namnbytet är
genomfört. Skillnaden är att den uppgiften hör hemma i ett svar till användaren,
inte i dokumenten.

Följden: namnbytet ligger på kritiska linjen. Tjänsten kan inte öppnas för
transaktioner förrän Verksamt är klart, eftersom dokumenten redan förutsätter
det namnet.

**Inget riktigt föremål släpps igenom före lansering. Sluta ta upp det.**

Varje föremål skapas som `pending` och måste godkännas manuellt av admin
innan det blir aktivt. Användaren är admin och släpper igenom ingenting
förrän BankID är skarpt, klientmedelskontot är öppnat och namnbytet är klart.

Det betyder att villkor och dokument får beskriva tjänsten som den fungerar
vid lansering, i presens, utan reservationer. Påpeka alltså **inte** varje
gång att BankID ligger i testläge eller att kontot inte är öppnat. Det är
redan hanterat av att ingenting släpps igenom.

**Adresser, tre olika och lätta att blanda ihop**

- **Registrerad adress:** Kvarnvingevägen 2, 177 41 Järfälla. Den som gäller
  mot Bolagsverket, Skatteverket och vid verifieringar hos leverantörer.
- **Postbox:** Box 6007, 102 31 Stockholm. Dit guldet skickas. Ligger i
  sidfoten och i fraktinstruktionerna.
- E-post: info@guldbud.com

**Domäner**

- **guldbud.com** är sajten och varumärket. Allt juridiskt, alla dokument och
  all uppsättning hos leverantörer bygger på den.
- **guldformedlingen.se** och **guldformedlarna.se** ägs också, men används
  inte. De är inte uppsatta någonstans. Använd dem aldrig som avsändare eller
  varumärke, och nämn dem inte i handlingar till revisor, bank eller
  leverantörer. Det skulle bara göra identiteten otydlig i en granskning.

Blanda aldrig gatuadressen med boxens postnummer. Kombinationen
"Kvarnvingevägen 2, 102 31 Stockholm" existerar inte och stoppar
registerkontroller.

**Läs de egna dokumenten, inte bara koden**

Affärsstatus som namnbyte, SNI, postbox och kontouppsättning står i artifacts
på claude.ai, inte i repot. Kolla dem innan du frågar användaren om sådant,
och innan du påstår något om bolagets status.

**Pengar**

- Handlarens betalning ska tas emot på **klientmedelskonto**, avskilt från
  bolagets egna medel, så kundernas pengar tydligt skiljs från företagets.
- Stripes utbetalningar ska gå till klientmedelskontot, inte till
  rörelsekontot.
- Kontot ligger hos **SEB**, samma bank som bolagets ordinarie konto.
- Upplägget är **två konton**: klientmedelskonto för säljarens pengar, och
  driftkonto för GuldBuds provision. Stripe betalar dock ut hela summan till
  **en** mottagare, så uppdelningen sker efter utbetalningen.
- **Klientmedelskontot är öppnat hos SEB 2026-09-01**, efter mötet samma dag.
  Kontonumret bor i `CLIENT_FUNDS_ACCOUNT` i `lib/company.ts` och är
  **kontrollerat av användaren i drift 2026-09-01**, mot bankens uppgifter,
  efter att rörelsekontots nummer först lagts in av misstag och rättats.
  Läxan: båda är giltiga SEB-nummer, så en checksumma skiljer dem aldrig åt.
  Verifiera kontonummer mot bankens papper, aldrig bara mot mod-11. Punkten
  är av kritiska linjen: ordersidan och fakturan visar kontouppgifterna.
- **Beslutat 2026-09-01: lansering med faktura och banköverföring, inte
  Stripe.** Handlaren betalar via banköverföring direkt till
  klientmedelskontot med ordernumret som referens, och admin prickar av
  betalningen manuellt. Kortflödet ligger kvar vilande i koden. Se
  beslutsloggen.
- Hos SEB ska avtalet **"Swish utbetalningar"** tecknas (deras exakta
  produktnamn, verifierat mot seb.se 2026-09-01) för säljarnas utbetalningar:
  60 kr/mån plus 2,50 kr per utbetalning, standardgräns 30 000 kr per
  utbetalning och höjd gräns begärd eftersom affärerna nått cirka 110 000 kr.
  I avtalet utses en certifikatansvarig (CPOC) som sedan genererar
  certifikaten i Swish portal. **Avtalet är ännu inte tecknat.** Tekniken är
  byggd och bevisad mot Swish testmiljö, se beslutsloggen.

**Leverantörer**

- Vercel (drift), Supabase (databas, auth, lagring)
- Stripe (kortbetalning), **vilande sedan beslutet 2026-09-01** att lansera
  med faktura och banköverföring. Kontot är godkänt i kategorin ädelmetaller
  och testnycklar ligger kvar i Vercel, men inga skarpa nycklar ska läggas in
  och ingen live-webhook sättas upp utan nytt beslut. Skälet till bytet:
  avgiften 1,5 procent tas på hela summan handlaren betalar, vilket räknat
  mot `lib/fees.ts` äter 15 till 20 procent av GuldBuds intäkt exklusive
  moms, och banköverföring saknar chargebacks. Koden och API-rutterna ligger
  kvar orörda som option.
- Direkt banköverföring är planen på sikt, men **ingen sådan leverantör är
  inkopplad**. Brite-adaptern togs bort 2026-08-30, se beslutsloggen.
- Resend (transaktionsmejl), Zoho (mänsklig inkorg)
- Anthropic (AI-värdering), Trustpilot (omdömen), PostNord (rekommenderat
  brev med kundavtal)
- BankID via Idura och Criipto. Ligger i testläge och slås på först på
  lanseringsdagen, eftersom tjänsten kostar från att den aktiveras.

**Trustpilot**

- Profilen finns och är hävdad: se.trustpilot.com/review/guldbud.com
- Registrerad augusti 2026, 6 omdömen, betyg 4,2
- Widgeten på startsidan visar bara loggan. Synligt stjärnbetyg kräver
  Trustpilots betalplan.

---

## Arbetssätt

- **Ändra bara exakt det som efterfrågas.** Inga extra förbättringar på eget
  initiativ.
- **Uppdatera betyder uppdatera.** Blir du ombedd att uppdatera något,
  korrigera det som är fel och lämna resten. Skriv aldrig om från grunden.
- **Spara innan du skriver över.** Aldrig en destruktiv åtgärd utan att först
  ha läst och sparat det som finns.
- **Verifiera i stället för att gissa.** Läs koden innan du beskriver den.
- **SQL skrivs alltid ut som block i chatten, aldrig som en bifogad fil.**
  Användaren kan inte öppna filerna som skickas från den här miljön. Dela upp i
  numrerade block som körs i ordning, och skriv ut hela funktioner ordagrant
  även när de är långa. Att hänvisa till "kör den ur schemafilen" hjälper inte.
  Kontrollfrågor ska köras ensamma, eftersom Supabase bara visar resultatet av
  den sista satsen i en körning.

## Språk och ton

- Svenska, enkelt språk, inga engelska facktermer i onödan.
- **Använd aldrig tankstreck.** Skriv om meningen i stället.
- Rakt på sak. Inga överdrivna ursäkter, ingen självrannsakan.

## Git

- Utveckling sker på `claude/auction-page-modern-complete-roeqlj`.
- Claude skapar och mergar pull requests själv (squash), och resyncar sedan
  branchen mot main.
- Klistra aldrig in skarpa nycklar eller hemligheter i kod, commits eller chatt.
  De hör hemma i Vercels miljövariabler.

## Projektet

- Kodkatalog: `guldbud/guldbud/` räknat från repotroten. Kör kommandon därifrån.
- Next.js 14 App Router, TypeScript, Tailwind, Supabase, Vercel.
- **Verifiering:** `npx tsc --noEmit` och `npm run build`. Det finns inga
  automatiska tester, så en genomklickning på riktigt är enda riktiga
  verifieringen av ett flöde.
- Bygget i sandlådan ger prerender-fel eftersom Supabase-nycklar saknas där.
  Det är miljön, inte koden. Kontrollera mot ett bygge utan dina ändringar
  innan du påstår att något är trasigt.

## Affärsmodellen

Avgifterna räknas ut på ett enda ställe: `lib/fees.ts`. Läs den innan du
uttalar dig om belopp eller moms.

- Föremålet: säljarens pris, ingen moms, privatperson säljer begagnat.
- Provision: 8 procent av budet, plus 25 procent moms.
- Frakt: 199 kr inklusive moms.
- Handlaren betalar allt i en summa, omgående vid vunnet bud.
- Medlen tas emot på klientmedelskonto, avskilt från bolagets egna medel.
- Säljaren får hela budet, utan avdrag.

Räkneexempel, bud 30 000 kr, uträknat ur `lib/fees.ts`:

| Post | Belopp |
|---|---|
| Föremålet, till säljaren, 0 procent moms | 30 000,00 kr |
| Köparprovision 8 procent | 2 400,00 kr |
| Moms på provisionen | 600,00 kr |
| Frakt exklusive moms | 159,20 kr |
| Moms på frakten | 39,80 kr |
| **Handlaren betalar totalt** (`dealerTotal`) | **33 199,00 kr** |
| Varav GuldBuds del (`guldbudServiceTotal`) | 3 199,00 kr |

Provisionen avrundas till hela kronor, och momsen räknas på den redan
avrundade provisionen. Fraktens momsdelning har två decimaler.

**Avgifterna är en daterad historik, inte konstanter.** `FEE_SCHEDULES` i
`lib/fees.ts` är en lista med ett `effectiveFrom` per post. Två vägar in, och
att välja fel är misstaget att undvika:

- `feesAt(order.created_at)` för allt som rör en **befintlig affär**: de tre
  dokumenten, båda betalrutterna, ordervyn, adminvyn, handlarens panel och
  nyckeltalen. Handlaren ska debiteras exakt det fakturan visar.
- `CURRENT_FEES`, eller de gamla exporterna som numera pekar på den, för allt
  som är **framåtblickande**: budformuläret, "så här mycket kostar det om du
  vinner".

Ska avgifterna ändras: **lägg till en ny post med det datum den börjar gälla.
Ändra aldrig en befintlig post.** Att ändra en gammal post är samma sak som att
skriva om redan utfärdade fakturor.

---

## Arkitekturen

Läs det här innan du börjar leta i koden. Allt nedan är läst i repot.

**Var koden ligger**

| Katalog | Vad som finns där |
|---|---|
| `app/` | 50 sidor plus 12 API-rutter. App Router |
| `app/api/` | payments, bankid, notify-email, gold-price, suggest-listing, orders, admin |
| `app/guider/` | 20 SEO-artiklar, alla byggda på `components/GuideShell.tsx` |
| `components/` | 40 komponenter |
| `lib/` | 21 filer. `fees`, `orders`, `aml`, `terms`, `payments/`, `pdf/`, `idura` |
| `supabase-schema.sql` | 1694 rader. Tabeller, RLS, triggers, spärrar, cron |

**Var behörigheten faktiskt sitter**

Det här är den viktigaste arkitektoniska punkten i projektet. `middleware.ts`
skyddar **ingen** rutt. Den gör bara `getUser()` för att förnya sessionen.
Alla rollgrindar på sidnivå är klientkod i `useEffect`.

Klienten pratar dessutom med Supabase direkt i 28 filer. Skrivningar går rakt
mot tabellerna, inte via API-rutter. **All verklig auktorisering ligger därför
i RLS-policyerna i schemat.** Ändrar du en policy ändrar du säkerheten. Ändrar
du en klientgrind ändrar du bara bekvämligheten.

Koden vet om det på flera ställen: `AcceptBid.tsx:37` och `admin/page.tsx:245`
kontrollerar att en rad verkligen uppdaterades, eftersom RLS-blockering ger
noll rader utan felmeddelande.

**Serverklienten kontra webbläsarklienten**

- `lib/supabase-server.ts`: cookie-baserad, för serverkomponenter
- `lib/supabase-route.ts`: för API-rutter
- `lib/supabase-browser.ts`: för klientkomponenter
- `app/page.tsx` och `app/auctions/page.tsx` skapar en egen cookie-lös
  anon-klient, eftersom `revalidate = 30` kräver det

**Servicerollen** används i sju API-rutter för att gå förbi RLS med avsikt:
bankid-callbacken, båda betalrutterna, båda fakturarutterna, mejlrutten och
auktionsavslutet. Den lämnar aldrig servern. Bildverktyget var den åttonde och
är borttaget, se beslutsloggen.

---

## Datamodellen

Tio tabeller: `profiles`, `items`, `bids`, `auto_bids`, `notifications`,
`orders`, `order_messages`, `watchlist`, `disputes`, `order_aml`.
Två buckets: `item-images` publik, `dealer-docs` privat.

`order_aml` ligger i egen tabell med flit. RLS är radnivå, och parternas
läspolicy på `orders` hade annars exponerat granskningsanteckningarna.

**Statusvärden, med den gällande definitionen**

- `items.status`: `pending`, `approved`, `active`, `closed`, `rejected`.
  `approved` är ett dött värde, det skrivs aldrig av någon kod. Admin går
  direkt från `pending` till `active`.
- `orders.status`: åtta värden. Den gällande constrainten är
  `orders_status_check` på rad 852, **inte** den inline på rad 813.
  Skillnaden är att `dealer_paid` tillkommer, ett utfasat värde.
  Stegkedjan i `lib/orders.ts` har sex steg: `accepted`, `shipped_by_seller`,
  `received`, `verified_paid`, `shipped_to_dealer`, `completed`.
- `orders.payment_status`: **ingen constraint**. `pending`, `paid`, `failed`,
  `amount_mismatch`, `null`. Schemakommentaren på rad 839 saknar
  `amount_mismatch` och är föråldrad.
- `order_aml.aml_status`: ingen constraint. `clear`, `review`, `approved`,
  `flagged`. Kolumnen heter `aml_status`, inte `status`.
- `disputes.status`: `open`, `under_review`, `resolved`, `rejected`.

**Fyra cron-jobb i pg_cron**

| Jobb | Schema | Vad det gör |
|---|---|---|
| `settle-ended-auctions` | varje minut | Notifierar om avslutad auktion. **Stänger den inte.** Status lämnas `active` tills säljaren accepterar |
| `process-unpaid-orders` | varje timme | Påminner, och avbryter plus stänger av handlaren efter `payment_due_at` plus 4 dygn |
| `notify-ending-soon` | varje minut | Bevakare, mindre än en timme kvar |
| `notify-bidders-ending-soon` | varje minut | Budgivare som inte leder, cirka 10 minuter kvar |

Båda de tunga funktionerna har körningslås med `pg_try_advisory_xact_lock`.

**`process-unpaid-orders` saknades i skarpa driften fram till 2026-08-31.**
`cron.job` innehöll bara tre av de fyra jobben: funktionen fanns i `pg_proc`
men ingenting anropade den, så obetalda ordrar fick varken påminnelser eller
automatisk avbrytning. Schemafilens do-block sväljer fel med
`exception when others`, så bortfallet var tyst. Jobbet är schemalagt på nytt
2026-08-31 och verifierat mot `cron.job`: fyra jobb, alla aktiva. Vill du veta
vad som faktiskt är schemalagt, fråga `cron.job`, inte filen.

**Testordrarna neutraliserades innan jobbets första körning, 2026-08-31.**
Tio obetalda ordrar låg kvar från testperioden, och den första körningen hade
avbrutit åtta av dem, stängt av båda handlarkontona och mejlat handlarna
"Ditt konto har stängts av". Jobbet pausades med `cron.alter_job`, ordrarna
städades, och jobbet aktiverades igen. Slutläge, verifierat: noll ordrar med
frist kvar att jaga, fyra aktiva jobb, noll avstängda handlare, inga notiser
och inga mejl skapade. Order 1 står kvar som `completed` utan registrerad
betalning, från tiden innan utbetalningsspärren fanns. Den är medvetet orörd:
funktionen filtrerar bort `completed`, så den är ofarlig historik.

Städningen gav tre läxor värda att spara:

- **Fristen nollas, ordern rörs inte i övrigt.** Åtta ordrar fick
  `payment_due_at = null`, vilket tar dem ur funktionens urval för alltid utan
  att ändra status, skapa notiser eller skicka mejl.
- **En rad i spärrad status utan betalning kan inte uppdateras alls, bara
  avbrytas.** Order 4 stod i `shipped_to_dealer` utan `dealer_paid_at`, och
  `enforce_payment_before_release` är en before update-trigger som slår på
  varje uppdatering av en sådan rad, oavsett vilken kolumn som ändras. Enda
  vägen ut är `status = 'cancelled'`, som passerar spärren.
- **`cancelled` är den tysta statusen.** `notify_order_status` har grenar bara
  för `received`, `verified_paid`, `shipped_to_dealer` och `completed`. En
  övergång till `cancelled` skapar varken notiser eller mejl. Att backa till
  `received` hade däremot mejlat handlaren, eftersom dubblettskyddet bara
  täcker notiser som redan skickats en gång.

**Skydd mot läckta lösenord är påslaget, 2026-08-31.** Supabase Auth
kontrollerar nu nya lösenord mot HaveIBeenPwned vid registrering och
lösenordsbyte. Flaggades av Supabases säkerhetsrådgivare, slogs på i
dashboarden under e-postleverantörens inställningar, och Attack
Protection-sidan visar Enabled. Befintliga konton påverkas först när de byter
lösenord. Inställningen ligger i Supabase-dashboarden, inte i repot, så den
syns inte i någon fil här.

---

## De tre resorna

**Säljaren.** Registrerar sig med bara namn, e-post och lösenord
(`app/auth/login/page.tsx`). `/customer/submit` grindar på komplett profil och
skickar annars till `/customer/profile?from=submit`. Lägger ut föremål med
minst 2 och högst 6 bilder, ursprungsval och ägarintyg. Föremålet skapas som
`pending` med `mandate_accepted_at` och `terms_version`. Admin godkänner och
sätter sluttid 48 timmar fram. Säljaren följer buden i realtid, accepterar via
`AcceptBid`, skickar guldet, och får betalt när admin sätter `verified_paid`.

**Handlaren.** Registrerar sig med fullt företagsformulär, får `approved=false`
och skickas till `/auth/pending`. Admin godkänner manuellt i `/admin`. Att neka
raderar profilraden. Handlaren budar från två ytor, auktionssidan
(`BidSection`) och `/dealer/dashboard`, med autobud i `auto_bids`. Vid vinst
skapar en databastrigger ordern. Betalar via `/orders/[id]`, tar emot varan.

**Adminen.** `/admin` är kontrollrummet: godkänna handlare och föremål, styra
auktioner, godkänna vinnande bud åt säljaren, nyckeltal. `/admin/orders/[id]`
är affärsvyn: statusstege, ekonomi, penningtvättsbeslut, tvister, två separata
chattrådar, retur och kreditering. `/admin/overvakning` är helt läsande och
flaggar handlare som vinner för lätt.

---

## Betalning och pengaflöde

**Obs 2026-09-01: steg 3 och 4 beskriver det vilande kortflödet.** I drift
betalar handlaren via banköverföring enligt instruktionen på ordersidan, och
admin sätter `dealer_paid_at` manuellt. Se beslutsloggen om faktura och
banköverföring.

1. Säljaren accepterar. `enforce_accepted_bid_valid` kontrollerar att budet är
   det högsta och tillhör föremålet. `notify_bid_accepted` skapar ordern med
   `payment_due_at = now() + interval '1 day'`.
2. `set_order_aml_status` sätter `clear` eller `review` direkt vid orderns
   skapande. Trösklar: 25 000 kr per affär, 50 000 kr rullande 12 månader.
3. Handlaren startar betalningen via `/api/payments/create`, som öppnar en
   Stripe-session och skriver `payment_status = 'pending'`.
4. Leverantörens webhook träffar `/api/payments/callback`. Signaturen
   verifieras, beloppet kontrolleras, och vid träff sätts `dealer_paid_at`.
5. Admin flyttar affären framåt. `enforce_payment_before_release` blockerar
   `verified_paid` och `shipped_to_dealer` om betalning saknas eller om
   penningtvättsgranskningen inte är `clear` eller `approved`.

**Det finns ingen utbetalningsintegration.** `verified_paid` är en manuell
adminflagga. Själva utbetalningen till säljaren sker utanför systemet.

**De tre dokumenten**, `lib/pdf/invoiceDoc.tsx` speglad av
`app/orders/[id]/invoice/page.tsx`:

1. Säljarens underlag: hela budet, inget avdrag, ingen moms
2. Handlarens inköpsunderlag: parterna är handlaren och säljaren, GuldBud står
   i en egen ruta som förmedlare
3. GuldBuds faktura: provision plus frakt plus moms. **Momsnumret visas bara
   här**, aldrig på inköpsunderlaget

Den uppdelningen är hela den juridiska poängen: varuledet är momsfritt mellan
privatperson och handlare, tjänsteledet är momspliktigt mellan GuldBud och
handlare.

---

## Identitet och penningtvätt

BankID går via Idura med OIDC och PKCE, `lib/idura.ts`. Det finns **ingen
uttrycklig test- eller skarpflagga**. Två oberoende reglage styr det:

1. `iduraConfigured()` är sant när alla tre Idura-variabler finns. Testläge
   kontra skarpt avgörs enbart av vilken `IDURA_DOMAIN` som är satt.
2. `NEXT_PUBLIC_BANKID_ENABLED` avgör om BankID är **obligatoriskt**, både för
   säljaren som listar och för handlaren som budar. Den läses numera på ett
   enda ställe, `BANKID_LIVE` i `lib/identity.ts`, som fyra ytor importerar.
   Lägg aldrig en egen jämförelse mot miljövariabeln i en komponent.

De två kan glida isär åt båda håll. Utan BankID faller listningsgrinden
tillbaka på ett självdeklarerat personnummer utan checksiffrekontroll.

Penningtvättspolicyn ligger i `docs/aml-policy.md` och är märkt som utkast med
tomma fält för dokumentägare och fastställandedatum.

---

## Miljövariabler

20 stycken. Namnen står här, aldrig värden. De sätts i Vercel.
Sju försvann när Brite togs bort: `PAYMENT_PROVIDER` och de sex `BRITE_`.

**Publika**, bakas in i webbläsarbundlen: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_BANKID_ENABLED`, `NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM`.

En `NEXT_PUBLIC_`-variabel kan aldrig vara hemlig, och den läses vid bygget.
Ändrar du en måste sajten deployas om.

**Hemliga**: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`,
`EMAIL_WEBHOOK_SECRET`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `TRUSTPILOT_AFS_BCC`,
`ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `IDURA_DOMAIN`, `IDURA_CLIENT_ID`,
`IDURA_CLIENT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_API_BASE`,
`STRIPE_WEBHOOK_SECRET`, `STRIPE_CURRENCY`.

**Swish utbetalningar, sätts när certifikaten finns:** `SWISH_TLS_CERT`,
`SWISH_TLS_KEY`, `SWISH_SIGNING_CERT`, `SWISH_SIGNING_KEY` (alla fyra är
Base64-kodade PEM-strängar), `SWISH_PAYER_ALIAS` (bolagets Swish-nummer) och
`SWISH_PAYOUT_API_BASE` (MSS `https://mss.cpc.getswish.net` i test, utelämnas
i produktion där koden defaultar till `https://cpc.getswish.net`). Saknas
någon av dem svarar utbetalningsrutten 503 och admin faller tillbaka på
banköverföring, ingenting går sönder. **`SWISH_TLS_CERT` måste innehålla hela
certifikatkedjan**, inte bara lövcertet, annars avvisar Swish handskakningen
med alert 40. Lärt den hårda vägen mot MSS 2026-09-01.

Det finns ingen `.env.local.example` i repot, trots att `README.md` hänvisar
till en.

---

## Beslutslogg

Varför saker är som de är. Det här syns inte i koden, och det är det som går
förlorat mellan fönstren.

**Bilderna laddas upp i 2560 px vid kvalitet 0,92.** Kunden ska kunna fota
direkt med mobilen och ladda upp utan att spara om. En hårdare komprimering
förstör den upplevelsen. Uppladdningen får därför aldrig blockeras på grund av
filstorlek. Ett försök att göra det revertades i PR #257.

**Loadern var avstängd tills Supabase Pro var på.** Bildtransformeringen
kräver Pro. Utan flaggan returnerar `lib/imageLoader.js` original-URL:en
oförändrad, precis som den gamla `unoptimized`-vägen. Ingenting kan gå sönder
på en plan utan transformering. Flaggan är numera satt och transformeringen
kontrollerad, se beslutsloggen.

**Vercels bildoptimering används inte alls.** Den slog tidigare i månadskvoten
och gav 402 och svarta bilder. Därför egen loader.

**`SETTLEMENT_CURRENCY` i betalcallbacken är en konstant, inte
`STRIPE_CURRENCY`.** Hela poängen med kontrollen är att fånga en felställd
`STRIPE_CURRENCY`. Jämför man env-värdet mot sig självt passerar det alltid.

**Beloppsavvikelse svarar 200, inte 500.** En retry skickar samma felaktiga
belopp igen och kan aldrig lösa något. Ärendet kräver en människa. Däremot
svarar rutten 500 om själva flaggningen misslyckas, för då vill vi ha en retry.

**Handlarens frist är ett dygn, inte tre.** Triggern på rad 930 sätter
`now() + interval '1 day'`. Raden 847 med tre dagar är en **engångsbackfill**
av historiska rader. Läs aldrig den som regeln.

**Utbetalningsspärren finns definierad två gånger.** Rad 1113 och rad 1521.
Den som gäller är **1521**, eftersom `create or replace` skriver över och
triggern återskapas därefter. Bara den versionen har penningtvättskontrollen
och `security definer`. Den senare är nödvändig: `order_aml` har bara
adminpolicy, så utan den hade läsningen gett null och spärren tyst släppt
igenom. Rad 1113 är dödkod, men farlig dödkod om filen delas i migreringar.

**`accepted_bid_id` saknar foreign key med avsikt**, och därför finns
`enforce_accepted_bid_valid`. Utan spärren kunde en ägare peka på ett bud från
en annan auktion och skapa en affär mot en handlare som aldrig budat, som
sedan automatiskt stängs av för utebliven betalning.

**Förmedlingsuppdraget är inbakat i villkoren, inte ett eget avtal.** En
säljare hade inte signerat ett separat kontrakt med BankID för att sälja ett
smycke. Uppdraget godkänns vid registrering, publiceringen är instruktionen,
och `/admin/items/[id]/uppdrag` renderar kvittot i efterhand ur
`mandate_accepted_at` och `terms_version`.

**Uppdragskvittot ligger i adminpanelen, inte hos kunden.** Beslutat av
användaren 2026-08-31. Sidan låg under `/customer/items/[id]/uppdrag` och var
länkad från "Mina föremål". Säljaren har redan godkänt villkoren när kontot
skapades och ser uppdragstexten i formuläret när föremålet publiceras, så
handlingen fyller ingen funktion för kunden. Den finns för att kunna tas fram
när revisor eller Skatteverket frågar hur förmedlingen gick till.

Texten är därför omskriven från andra person till tredje: handlingen läses av
GuldBud om säljaren, inte av säljaren själv. Sakinnehållet är oförändrat.
Adminvyn läser säljarens profil via `item.owner_id`, inte den inloggades, och
policyn `admins manage all profiles` ger läsrätten. Nås från både väntande
föremål och auktionsraderna i `/admin`.

**Det är en yta, inte en spärr.** Säljaren äger sin rad i `items` och kommer åt
sina egna uppgifter via RLS ändå. Handlingen presenteras inte längre för
kunden, men den är inte hemlig för hen, och det går inte att göra den hemlig
utan att gå emot att uppgifterna är säljarens egna.

**Priset justeras inte efter kontroll, det omförhandlas.** Tidigare sa
villkoren att priset "kan justeras", vilket beskriver en köpare och inte en
förmedlare. Nu lämnar handlaren ett nytt bud som säljaren får acceptera eller
avböja. GuldBud fastställer aldrig priset.

**Schemafilen och databasen hade glidit isär.** Kontrollerat 2026-08-30 genom
att lista `pg_proc` och `pg_trigger` i den skarpa databasen och jämföra mot
filen. Fem avvikelser, alla åt samma håll: databasen innehöll mer än filen.

- `notify_bid_declined` och triggern `on_bid_declined` fanns bara i databasen.
  Nu införda i filen, hämtade med `pg_get_functiondef` och inte omskrivna.
- `email_notification_webhook` och triggern `on_notification_email` fanns bara
  i databasen. **Den är fortfarande inte i filen**, se nedan.
- `notify_dealer_paid` och triggern `on_dealer_paid` levde i databasen trots
  att filen tar bort dem på rad 1132. Att drop-satsen inte fått effekt visade
  att **filen inte hade körts hela vägen igenom på länge.** Nu borttagna.
  Triggern gjorde skada: den bad säljaren skicka in föremålet först när
  handlaren betalat, tvärtemot modellen, och titeln innehöll "skicka in"
  vilket fick mejlrutten att klistra på samma instruktionsruta en andra gång.
- `notify_on_bid` och `notify_on_outbid` låg kvar utan trigger, ren dödkod.
  Nu borttagna.

Avvikelserna är hopfogade 2026-08-30 och kontrollerade mot `pg_trigger` efteråt.

Slutsats att bära vidare: **läs inte filen som om den vore databasen.** Vill du
veta vad som faktiskt körs, fråga `pg_proc` och `pg_trigger`.

**`email_notification_webhook` har hemligheten hårdkodad i funktionskroppen.**
Den anropar `/api/notify-email` med `x-webhook-secret` i klartext i SQL:en.
Därför är den medvetet inte införd i schemafilen: en commit hade lagt
`EMAIL_WEBHOOK_SECRET` i git för alltid. Två vägar finns, platshållare i filen
eller `current_setting('app.email_webhook_secret', true)` plus en
`alter database`. Beslut saknas. Funktionen saknar dessutom `set search_path`,
till skillnad från alla andra `security definer`-funktioner i systemet.

**Att byta den hemligheten tar fyra steg, och hoppar du över ett slutar alla
mejl fungera.** Den finns på exakt två ställen som måste ha samma sträng:
`EMAIL_WEBHOOK_SECRET` i Vercel och funktionskroppen i databasen. Ordningen är
Vercel, **omdeploy**, sedan databasen. Omdeployen är inte valfri: en miljövariabel
slår aldrig igenom på en deploy som redan kör, så utan den jämför sajten med det
gamla värdet.

Rutten trimmar inte och har ingen reservväg (`route.ts:174`), så minsta avvikelse
ger 401 på varje anrop och noll mejl. Rotationen den 2026-08-30 tog fyra försök,
eftersom Vercel-värdet sattes innan den slutliga strängen fanns. Generera alltid
en ny sträng, klistra in den i en textfil, och kopiera därifrån till båda
ställena i samma sittning. Skriv aldrig av den.

Felsök i `net._http_response`, som visar vad databasens anrop faktiskt fick
tillbaka. 401 betyder att strängarna skiljer sig, 200 att kedjan är hel. Testa
utan att skicka mejl genom att posta ett påhittat notis-id: rutten godkänner
nyckeln, hittar ingen rad och svarar 200 med `skipped`. Tabellen rensas efter
några timmar, så historik längre bak finns inte.

**Listningskraven ligger i en trigger, inte i en constraint.** En check-constraint
kan inte läsa `profiles`, och identitetskravet behöver det.
`enforce_listing_requirements` är därför en `before insert or update`-trigger
på `items`, sist i schemafilen. Tre val är medvetna:

- **INSERT kräver uppgifterna, UPDATE gör det inte.** Föremål som skapades
  innan kolumnerna fanns har null. De ska fortfarande gå att godkänna och
  sälja. UPDATE-grenen förbjuder däremot att ett satt värde nollas, så
  historiken kan inte raderas i efterhand.
- **Identitetskravet speglar klienten:** BankID eller angivet personnummer.
  Databasen kan inte läsa `NEXT_PUBLIC_BANKID_ENABLED`, som är en
  byggtidsflagga i webbläsaren. När BankID är skarpt skärps kravet genom att
  ta bort or-grenen på den märkta raden.
- **Adress och utbetalningsuppgifter kontrolleras inte där.** De behövs först
  vid utbetalning, och den vägen har redan sin egen spärr.

Följden: ett gammalt föremål utan `source_type` går inte att återlista med ett
klick längre. Båda återlistningsvägarna fångar det och hänvisar till
formuläret, i stället för att visa ett databasfel.

**`paymentsConfigured()` kräver både nyckel och webhook-hemlighet.** Utan
hemligheten bailar `verifyCallback` ut innan den tittar på något, så varje
callback besvaras 400 och `dealer_paid_at` sätts aldrig. Handlaren hade betalat
på riktigt in i en session ingenting kan bekräfta, utbetalningsspärren fortsatt
blockerat, och `process_unpaid_orders` till slut stängt av en handlare som inte
gjort något fel. Att vägra öppna betalningen alls är den säkra änden av den
avvägningen. Adminens manuella `dealer_paid_at` skriver rakt mot tabellen och
berörs inte.

**Brite togs bort 2026-08-30.** Adaptern var aldrig färdig, elva öppna TODO om
ett obekräftat API-kontrakt, och den returnerade aldrig något belopp. Ändå var
den standardvalet: `PAYMENT_PROVIDER` behövde vara exakt strängen `stripe`,
annars föll koden tillbaka på Brite och beloppskontrollen i callbacken slog av
sig själv. Ett stavfel räckte. Abstraktionen finns kvar, så att koppla in
direkt banköverföring senare är fortfarande en ändring på ett enda ställe.
`payment_provider` på ordern skrivs numera från konstanten
`PAYMENT_PROVIDER_NAME`, inte från en miljövariabel, så bokföringsspåret alltid
namnger den rail som faktiskt tog pengarna.

**Sena och dubbla callbacks larmar i stället för att skriva.** Två fall i
`/api/payments/callback` får aldrig röra ordern, men får heller aldrig försvinna
tyst. De larmar admin via `notifications`, som också går vidare till mejl.

- **Krediterad eller avbruten affär.** Kontrollen ligger *före*
  idempotenskontrollen, med flit. Krediteringen i `admin/orders/[id]`
  (`refundOrder`) nollar `dealer_paid_at`, så en sen callback hade mött ett tomt
  fält och satt betalningen på nytt. Det hade återarmerat utbetalningsspärren på
  pengar som redan gått tillbaka till handlaren.
- **Dubbel betalning.** Är ordern redan betald jämförs sessionen som anmäler sig
  mot `payment_reference`. Samma session är en omleverans och passerar tyst.
  En annan session betyder att handlaren betalat två gånger. Därför skriver
  settle-grenen numera `payment_reference` till den session som *faktiskt*
  betalade, inte den senast skapade.

Ingen av dem skriver `payment_status`, eftersom det värdet är något admin satt
med avsikt vid kreditering. Båda svarar 200 med `ok: false`, av samma skäl som
beloppsavvikelsen: en retry levererar samma händelse igen och kan aldrig lösa
något. Svaret blir 500 bara om själva larmet inte gick att skriva, för då vill
vi ha en retry.

**Två betalsessioner kan fortfarande vara öppna samtidigt. Det är ett val.**
En övergiven Stripe-session stängs aldrig av oss, och vi lagrar ingen tidsstämpel
för när en session skapades. Att blockera på en `pending`-session hade därför
låst ute varje handlare som råkat stänga betalfönstret, permanent. Luckan är i
stället stängd i andra änden: en andra betalning kan inte längre passera
oregistrerad. Vill man stänga den helt krävs antingen `expires_at` på sessionen
plus en tidsstämpel på ordern, eller ett anrop till leverantören för att se om
den gamla sessionen fortfarande lever.

**`amount_mismatch` blockerar en ny betalsession.** `/api/payments/create` vägrar
öppna en session på en flaggad order. Annars hade `payment_status: 'pending'`
skrivit över flaggan, alltså det enda beständiga spåret av att pengar kommit in
med fel belopp eller fel valuta. Admin rensar flaggan genom att kreditera eller
återöppna affären, som båda nollar `payment_status`. Handlaren får en text som
säger att betalningen granskas, inte "försök igen", eftersom ett nytt försök
aldrig hjälper.

**Avgifterna daterades i stället för att frysas på ordern.** En faktura ska visa
samma belopp för alltid. Två vägar fanns.

Den ena var att skriva ner de färdiga beloppen på ordern när den skapas. Den
valdes bort: ordern skapas av en databastrigger, så avgiftsmodellen hade fått
finnas en gång till i SQL. Två sanningar om pengar som kan glida isär är precis
det `lib/fees.ts` finns för att förhindra.

Den andra, som gäller: modellen förblir en enda fil, men blir en lista av
perioder med `effectiveFrom`. Ankaret är `orders.created_at`, alltså när
säljaren accepterade budet och beloppen blev bindande för båda parter. Det
krävde ingen ny kolumn, ingen migrering och ingen ändring av triggern, och det
gäller retroaktivt för varje rad som redan finns.

Följden: en affär som slöts före en avgiftsändring behåller de gamla avgifterna
även om den betalas efteråt. Det är avsikten, inte en bieffekt. Handlaren bjöd
under de villkor som var publicerade då.

Ett oläsbart datum faller tillbaka på den **äldsta** perioden, aldrig den
nyaste. En rad vi inte kan datera är per definition inte ny.

**Betalrutterna följde med, och det var inte valfritt.** Hade bara dokumenten
daterats skulle fakturan visa gamla avgifter medan Stripe drog nya. Då hade
beloppskontrollen i callbacken flaggat varenda affär som slöts före ändringen
som `amount_mismatch`. Det hade varit sämre än felet vi rättade.

**Säljarens identitet lämnas ut efter betalning, inte vid vunnen auktion.**
Handlaren behöver namn, personnummer och adress för sitt inköpsunderlag, alltså
för att bokföra ett köp av begagnade varor från en privatperson. Det behovet
uppstår när köpet är gjort. Tidigare räckte det att ordern fanns, så en handlare
som vunnit och sedan aldrig betalat fick ändå ut en privatpersons fullständiga
identitet, och detsamma gällde efter kreditering.

Grinden ligger i `lib/identityRelease.ts` och **delas av två rutter**,
`/api/orders/[id]/seller` och `/api/orders/[id]/invoice-pdf`. Den senare hade
exakt samma läcka utan att stå i fyndlistan. En grind som finns på två ställen
glider isär, därför en fil.

Admin är undantagen: adminvyn är arbetsverktyget för penningtvättsgranskning och
tvister och behöver identiteten även på en affär som gått tillbaka.

**Loggen skrivs före utlämnandet, och stoppar det om den misslyckas.** Går raden
inte att skriva till `identity_disclosures` svarar rutten 500 och inget lämnas
ut. Ett utlämnande utan spår är precis det konstruktionen finns för att
förhindra. Följden är att **tabellen måste finnas i databasen**, annars får
handlaren "Privatperson" på sitt inköpsunderlag.

**Ett personnummer hör till ett konto, och därför normaliseras det.** Det unika
indexet på `verified_ssn` gör den kumulativa penningtvättströskeln meningsfull:
utan det kan samma person verifiera obegränsat många konton och sprida sina
affärer så att tröskeln aldrig nås. Indexet ensamt räcker dock inte, eftersom
`900101-1234` och `199001011234` är olika strängar. Callbacken lagrar därför
alltid den normaliserade tolvsiffriga formen, via `lib/identity.ts`.

**`payload.sub` togs bort som personnummerreserv.** `sub` är ett ogenomskinligt
subject-id hos leverantören, inte ett personnummer. Reserven skrev in en
identifierare som såg ut som ett verifierat personnummer utan att vara det, och
den gamla `if (!ssn)`-kontrollen kunde per definition inte fånga det eftersom
fältet var ifyllt. Kravet är nu Luhn-kontroll, vilket både ett GUID och ett
`auth0|...`-subject faller på.

**Utfärdare och nycklar hämtas ur discovery-dokumentet, inte ur domännamnet.**
`id_token` verifieras med RS256 mot leverantörens JWKS. Både `issuer` och
`jwks_uri` läses ur `/.well-known/openid-configuration`. Att i stället bygga
issuer-strängen av `IDURA_DOMAIN` hade varit en gissning, och gissar man fel
slutar BankID fungera först den dag det slås på skarpt.

Algoritmen låses till RS256 i stället för att läsas ur token. Att lita på
`alg` i headern är det klassiska JWT-felet: `none` gör signaturen meningslös.
Nonce, aud, iss och exp är nu **obligatoriska**. Tidigare kontrollerades de
bara om fältet fanns, så en token utan nonce passerade.

**`/api/notify-email` läser alltid innehållet ur databasen.** Tidigare gällde
det bara när body:n råkade ha ett id. Saknades id:t användes body:ns egna fält,
så den som har webhook-hemligheten kunde skicka ett mejl med valfri rubrik, text
och länk till valfri användare, avsänt från GuldBuds egen adress. Body:n får nu
bara peka ut vilken rad som ska skickas.

**Bildverktyget tar inte längre `?secret=`.** En hemlighet i en query-sträng
hamnar i varje loggrad den passerar, och det var samma hemlighet som skyddar
mejlwebhooken. Adminknappen använde redan Bearer, så den påverkades inte.
Direktanrop via URL fungerar däremot inte längre.

**Guldkursen visas bara där den finns, aldrig simulerad.** `/api/gold-price`
levererar tre saker: priset, `changePct` mot gårdagens stängning, och `live`
som säger om det är kursen eller reservkonstanten. Alla tre ska respekteras.

`LiveGoldPrice` la tidigare tre sinusvågor ovanpå baspriset, ritade en sparkline
av dem och räknade fram "X procent idag" ur avståndet mellan det vandrande
värdet och basen. Ingen av siffrorna kom från en marknad. Det stod på
`/guider/guldpris-idag`, alltså exakt den sida där en besökare litar mest på
talet. `GoldTicker` hade redan tagit bort samma sak av samma skäl.

Sparklinen är borttagen och ska inte tillbaka utan en källa. Vi har ett pris nu
och en dagsförändring, ingen historik över dagen. En kurva utan data är
dekoration som utger sig för att vara mätning. Vill man ha den behövs faktiska
sparade mätpunkter, alltså en tabell och ett schemalagt jobb.

Rörelsesiffran visas nu bara när `changePct` inte är null.

**Kursen ska alltid komma från marknaden.** Cachen i `/api/gold-price` är en
minut, och `useGoldPrice` hämtar om lika ofta, så en öppen sida följer
marknaden i stället för att frysa vid första hämtningen. Tätare än så ger
inget: källorna uppdaterar ungefär i den takten.

Reservkonstanten finns kvar för att gränssnittet inte ska gå sönder, men den
får aldrig presenteras som en kurs. Är `live` false säger `LiveGoldPrice`,
`GoldTicker` och metallvärdet i `AuctionDetails` alla "riktvärde" i stället.
Lägger du till en ny yta som visar priset: läs `live`, inte bara `price`.

**Konstanten 1295 kr per gram är ett reservvärde, inte en kurs.** Den bor i
`GOLD_SPOT_SEK_PER_GRAM` och är default-argumentet i `meltValue` och
`estimateRange`. Just därför blev den fel överallt: den som glömde skicka in
kursen fick tyst ett hårdkodat tal, medan rutan bredvid sa "vid dagens kurs".

Alla sju anropsställen skickar nu in `useGoldPrice()`. Ska ett nytt läggas till,
skicka med kursen. Konstanten ska bara nås genom att `/api/gold-price`
misslyckas.

`/admin/overvakning` är ett undantag värt att förstå: den jämför avslutade
affärer mot en uppskattning, men vi sparar ingen historisk kurs, så jämförelsen
görs mot dagens. Det är trubbigt för äldre affärer och står nu utskrivet i
gränssnittet i stället för att låtsas vara exakt.

**Handlaren måste legitimera sig med BankID, precis som säljaren.** Beslutat av
användaren. Startsidan lovade "BankID-verifierade handlare" utan att kravet
fanns, och valet var att göra påståendet sant i stället för att ta bort det.

Spärren ligger i `dealer_may_bid` i schemat, ett predikat som tre ställen
använder: budpolicyn, autobudspolicyn och `resolve_auto_bids`. Att skriva
villkoret tre gånger hade gjort lanseringsdagens skärpning till tre ändringar,
och en glömd av tre är en tyst lucka.

**SQL:en är körd mot databasen 2026-08-31.** Användaren körde alla fyra blocken
och rapporterade att kontrollfrågorna gav rätt svar. Utfallet är alltså
användarens uppgift, inte något jag läst ur databasen själv.

`resolve_auto_bids` är med av ett skäl som är lätt att missa: ett autobud som
lades innan kravet fanns skulle annars fortsätta lösa ut bud från en handlare
som inte får buda idag.

Klientgrindarna i budrutan och handlarpanelen är bara besked om varför, inte
skyddet. Handlarpanelen förblir läsbar utan legitimering med flit: att kunna se
auktionerna är det som gör att en ny handlare orkar ta steget.

Vid lansering ska **båda** or-grenarna bort samma dag, `dealer_may_bid` och
`enforce_listing_requirements`, samtidigt som `NEXT_PUBLIC_BANKID_ENABLED` sätts
och sajten deployas om. De hör ihop.

**Verifieringen är en engångssak, och märket är en enda komponent.** Beslutat
av användaren. `identity_verified` sätts en gång av BankID-callbacken och nollas
aldrig av någon kod, så ingen behöver göra om det. Verifieringssidan visar
"Du är verifierad" i stället för att erbjuda en ny körning.

Märket bor i `components/VerifiedBadge.tsx` och används på verifieringssidan och
båda profilerna. Ett märke som ritas om lite olika på varje sida slutar betyda
något, poängen är att användaren känner igen det direkt. Ska det synas på en ny
yta: importera komponenten, rita inte en egen chip.

**Godkänd handlare och legitimerad handlare är två olika saker.** Handlarprofilen
sa tidigare "Verifierad handlare" enbart baserat på `approved`, alltså vårt
adminbeslut om företaget, utan att någon legitimerat sig. Nu står det "Godkänd
handlare" för det beslutet, och legitimeringsmärket är separat. Båda krävs för
att få buda, se `dealer_may_bid`.

**Verifieringssidan är rollmedveten.** Den talade tidigare bara till säljaren,
med texten "du kan lägga ut föremål" och en knapp till `/customer/submit`. En
handlare som legitimerade sig skickades alltså in i säljarflödet.

**Märket syns för motparten, men bara som ett ja eller nej.** Auktionssidan
visar om säljaren legitimerat sig. Uppgiften hämtas med
`item_seller_verified(item_id)`, en `security definer`-funktion som returnerar
en boolean och aldrig något ur profilen.

Att i stället lägga en läspolicy på `profiles` vore samma misstag som redan är
dokumenterat i schemat vid borttagandet av `public reads dealer names`: **RLS
kan inte begränsa kolumner**, så en läspolicy hade gjort hela raden läsbar,
personnummer och adress inklusive. Behöver en ny yta veta något om en annan
användare: gör en funktion som svarar på just den frågan.

Funktionen är öppen även för utloggade, eftersom auktionssidan är publik och
uppgiften säger att någon legitimerat sig, inte vem.

**Säljarmärket visas först när BankID är skarpt.** Innan dess kan ingen vara
verifierad, så märket hade stämplat varenda säljare som olegitimerad och sagt
något om vår testuppsättning i stället för om personen. Ett märke utan
informationsvärde är sämre än inget märke. Efter lansering kräver
listningsspärren BankID, så varje aktiv auktion har en legitimerad säljare.

Asymmetrin mot budhistoriken är avsiktlig: där står ett allmänt påstående om
tjänsten, som villkoren och startsidan får skrivas i presens för lansering.
Säljarmärket är ett faktapåstående om en namngiven enskild person och måste
vara sant nu.

**Åt andra hållet är det ett påstående, inte ett märke per rad.** Budhistoriken
säger att alla som budar är legitimerade handlare, vilket är sant genom
`dealer_may_bid`. Ett märke per budrad hade dessutom röjt något om enskilda
anonyma budgivare, alltså vilken av dem som inte är legitimerad.

**Underhålls-RPC:erna anropas via en adminrutt, aldrig från webbläsaren.**
`settle_ended_auctions`, `process_unpaid_orders` och `resolve_auto_bids` har med
flit exekveringsrätten återkallad från `anon` och `authenticated` i schemat, som
djupförsvar mot direktanrop via PostgREST. Adminpanelen anropade ändå
`supabase.rpc('settle_ended_auctions')` från klienten, inuti ett tomt
catch-block, så anropet misslyckades tyst vid varje klick och säljaren fick
vänta på cron-jobbet i stället.

Vägen går nu via `/api/admin/settle-auctions`, som kontrollerar adminrollen och
kör funktionen med servicerollen. **Ge inte tillbaka rätten till
`authenticated`** för att "fixa" ett liknande fel: det öppnar funktionen för
varje inloggad användare. Gör en rutt.

**Återkallandet bet inte förrän `public` togs med, rättat 2026-08-31.**
Postgres ger varje ny funktion execute till PUBLIC, och anon ärver rätten den
vägen även när anon själv är återkallad. De tre ursprungliga revokes hade körts
i skarpa databasen, syntes i `proacl`, och var ändå verkningslösa:
`has_function_privilege('anon', ...)` gav true genom `=X/postgres`. Rättat med
`revoke ... from public, anon, authenticated` på de fem underhållsfunktionerna,
plus `from public, anon` på `bid_kpi_summary`, som behåller `authenticated`
eftersom adminpanelen anropar den via `supabase.rpc()` och is_admin-kontrollen
ligger i funktionskroppen. Verifierat efteråt med `has_function_privilege` för
anon, authenticated och service_role. Läxan: bedöm aldrig en funktions
exponering genom att titta efter rollnamnet i `proacl`, fråga
`has_function_privilege`, det är den som räknar med PUBLIC.

**Bildkrympningen i adminpanelen är borttagen 2026-08-31.** Beslutat av
användaren. `/api/admin/optimize-images`, `components/ImageOptimizeButton.tsx`
och knappen i `/admin` är borta, liksom `sharp`, som bara den rutten använde.

Verktyget byggdes för att krympa redan uppladdade råa telefonfoton innan
transformeringen fanns, och det skrev över originalen. Med transformeringen på
är originalet det som Supabase skalar ifrån, så varje körning hade sänkt
källkvaliteten permanent för alla framtida storlekar. Det förstörde alltså sin
egen förutsättning.

Uppladdningens nedskalning till 2560 px vid kvalitet 0,92 i webbläsaren är en
annan sak och finns kvar. Se posten om bilderna ovan.

**Vercels plan har ingenting med bilderna att göra.** `next.config.js` sätter
`loader: 'custom'`, så Vercels bildoptimering används aldrig, oavsett plan.
Det som krävs för skalade bilder är Supabase Pro, som finns, plus att
`NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM` är exakt `true` i Vercel följt av en
omdeploy. Miljövariabler kostar ingenting på någon Vercel-plan.

**Transformeringen är på, kontrollerat 2026-08-31.** Frågan stod öppen i tre
artifacts som "variabeln finns sedan 30 augusti men värdet är inte
kontrollerat". Nu är den stängd: användaren skickade en annonsbilds adress och
den går genom `/storage/v1/render/image/public/` med
`width=1920&quality=75&resize=contain`, alltså precis det `lib/imageLoader.js`
bygger. Omställaren i Supabase, Storage och fliken Settings, är också påslagen.
Ingenting återstår att göra.

Så avgörs läget utan att gissa, om frågan dyker upp igen: titta på en
annonsbilds adress. Står det `/storage/v1/render/image/public/` med `width=` är
transformeringen på, står det `/storage/v1/object/public/` är flaggan av och
originalet levereras. Värdena går inte att läsa från den här miljön, och
proxyn blockerar både guldbud.com och supabase.com, så adressen måste komma
från användaren.

**Ingen chattwidget på sajten. Avskrivet 2026-08-31.** Frågan gällde en
bemannad chattruta av Weplys typ, alltså en tjänst där utomstående svarar i
GuldBuds namn. Tre skäl, och det första är det tunga:

- **Rollen.** Den som öppnar en chatt på en guldsajt frågar nästan alltid vad
  föremålet är värt. Det är exakt den fråga GuldBud inte får besvara. En inhyrd
  agent som säger "det brukar ligga runt 8 000" har flyttat oss från förmedlare
  till värderare, tvärtemot både villkoren och beslutet ovan om att priset
  omförhandlas i stället för att justeras.
- **Personuppgifter.** `app/privacy/page.tsx` lovar att underleverantörer
  behandlar uppgifter enligt personuppgiftsbiträdesavtal och att bara nödvändiga
  cookies används. En chattleverantör blir ett nytt biträde och sätter i regel
  egna cookies, så båda styckena hade behövt skrivas om. Chattrutor får
  dessutom in personnummer och adresser okontrollerat.
- **Bemanning.** En chattruta som ingen svarar i är sämre än ingen. Det är just
  det en bemannad tjänst löser, vilket leder tillbaka till första punkten.

Luckan är dessutom mindre än den ser ut: `info@guldbud.com` finns i sidfoten, i
villkoren, i verifieringsflödet och på auktionssidan, och `/meddelanden` ger två
trådar per affär. Det som saknas är bara den anonyme besökaren. Ska något ändå
byggas: en egen "fråga oss"-ruta som mejlar `info@guldbud.com`, alltså inget
tredjepartsskript, inga nya cookies, inget nytt biträdesavtal.

**Lanseringen sker med faktura och banköverföring, inte Stripe. Beslutat
2026-09-01.** Handlaren faktureras hela summan vid vunnet bud, betalar via
banköverföring direkt till klientmedelskontot, och märker betalningen med
ordernumrets referens (GB-XXXXXX). Admin prickar av betalningen manuellt via
`dealer_paid_at`, som alltid varit byggd för det. Skälen: Stripes 1,5 procent
på hela summan äter 15 till 20 procent av intäkten, banköverföringar saknar
chargebacks (viktigt för guldhandel), och köparna är granskade
B2B-handlare där korträlsens tillit inte behövs.

Så här ligger det i koden:

- Kontouppgiften bor i `CLIENT_FUNDS_ACCOUNT` i `lib/company.ts` och är
  **tom tills klientmedelskontot är öppnat**. Tills dess visar ordersidan att
  kontouppgifter meddelas i affärens meddelanden, och fakturan utelämnar
  kontodelen ur betalningsvillkoret. När kontot finns: fyll i numret,
  committa, deploya.
- Ordersidans betalknapp (`PayNowButton`) är ersatt av `BankTransferBox` med
  belopp, mottagare, konto och referens. Referensformatet är medvetet en
  lokal kopia av fakturans `ref()`: att importera `lib/pdf/invoiceDoc` i en
  klientsida hade dragit in react-pdf i webbläsarbundlen.
- Fakturans finstilta har betalningsvillkoret: omgående, via banköverföring,
  märkt med referensen. Speglad i båda fakturafilerna, ändrade på
  användarens uttryckliga instruktion (spärrade filer).
- **Kortflödet är vilande, inte borttaget:** `lib/payments/`, båda
  betalrutterna och beloppskontrollen ligger kvar orörda. Utan skarpa nycklar
  öppnas ingen kortbetalning. Riv inget av det utan beslut, och lägg inte in
  skarpa Stripe-nycklar utan nytt beslut.
- Med manuell avprickning är det admin som är beloppskontrollen. Vid volym
  över ungefär femtio affärer i månaden bör avprickningen automatiseras,
  bankkoppling eller Swish Handel är kandidaterna.

**Swish-utbetalningar till säljare: byggt mot API:t 2026-09-01, vilande
tills certifikat finns.** Bankavtalet som krävs är SEB:s produkt **"Swish
utbetalningar"** (inte Swish Handel eller företagsappen, de tar bara emot).
Byggt mot developer.swish.nu:s tre guider samma dag. Delarna:

- **`payouts`-tabellen**, körd mot databasen och i schemafilen: raden skrivs
  INNAN pengarna skickas, samma princip som identity_disclosures.
  `instruction_uuid` är unik så samma instruktion aldrig skickas två gånger.
  Bara admin läser via RLS, callbacken skriver med servicerollen.
- **`lib/payouts/swishPayout.ts`**: mTLS med TLS-certifikatet, payload
  signerad med signeringscertifikatets nyckel (SHA-512-hash av payloadens
  UTF-8-bytes, därefter SHA512withRSA, Base64, exakt enligt Swish
  Java-exempel; dubbeldigesten är avsiktlig). Serienumret läses ur
  certifikatet med X509Certificate, aldrig ur en egen variabel.
- **`/api/admin/payouts`**: samma admin-auth som settle-auctions. Grindarna
  speglar utbetalningsspärren: dealer_paid_at krävs, AML clear/approved,
  ej krediterad/avbruten, och en initiated/paid-rad blockerar nya.
  `payeeSSN` tas från `verified_ssn` i första hand. method bank_transfer
  bokför en gjord manuell överföring, method swish anropar API:t.
- **`/api/payouts/swish-callback`**: litar aldrig på kroppen. Verifierar
  `callbackIdentifier`-huvudet mot radens sparade hemlighet (Swish egen
  rekommendation) och slår sedan upp statusen med eget GET innan något
  skrivs. Svarar 500 när verifieringen inte går att göra, med flit: Swish
  gör om callbacken upp till tio gånger tills vi svarar 200. En förfalskad
  callback får 200 direkt så den inte bjuds på fler försök.
- **Adminvyn** har kortet "Utbetalning till säljaren" med radhistorik och två
  knappar: Betala ut via Swish och Registrera gjord banköverföring.

**Bevisat mot MSS 2026-09-01, hela kretsloppet:** en signerad utbetalning
skickades till testmiljön med Swish testcertifikat (samma hash- och
signeringssteg som `swishPayout.ts`), MSS svarade 201 Created, statusen blev
PAID, och MSS callback träffade `/api/payouts/swish-callback` i produktion
som svarade 200 (not_configured, korrekt eftersom miljövariablerna inte är
satta). Läxan från testet: hela TLS-certifikatkedjan krävs, se
miljövariabelavsnittet. Det som återstår är skarpa certifikat när
SEB-avtalet är klart, och en genomklickning av adminknappen med
miljövariablerna satta. SEB:s standardgräns är 30 000 kr per utbetalning,
höjd gräns är begärd.

**Fakturan möter handlaren där hen redan är. Byggt 2026-09-01.** Användaren
ville att fakturan "ploppar upp automatiskt" vid vinst. Löst i två vägar,
medvetet utan popup eller modal, som fastnar i blockerare och stör på mobil:

- **Vinnarmejlet bär fakturan.** Dokumentrutan i `/api/notify-email`
  (funktionen `documentBox`) skickas nu redan på "Grattis, du vann
  budgivningen", inte först efter betalning. Villkoret är titelmatchning på
  "vann" plus en `/orders/`-länk, samma mönster som de två befintliga
  penninghändelserna. Knappen "Öppna din faktura" går till affärens
  dokumentvy bakom inloggning, ingen bilaga, av samma skäl som tidigare:
  inköpsnotans personuppgifter ska inte ligga i ett mejl.
- **Betalrutan på ordersidan** har knappen "Öppna fakturan" som primär
  handling i `BankTransferBox`, i båda lägena, alltså även innan
  kontonumret är ifyllt. Den lilla "Visa faktura"-länken under kortet visas
  bara när affären är betald, så obetalt läge har en enda tydlig väg.

Mejlvägen är obevisad tills en riktig vinst utlöst mejlet: titelmatchningen
är läst i kod, inte sedd i en inkorg. Kontrollera fakturaknappen i
vinnarmejlet vid nästa testaffär.

**Svarslöftet i affärschatten är fast text, inte ett robotsvar i tråden.**
Beslutat av användaren 2026-08-31, som också valde formuleringen. Under
skrivrutan i `components/OrderChat.tsx` står "Vi ser ditt meddelande direkt och
svarar normalt samma dag", och bara för parterna, aldrig i adminvyn.

Ett automatiskt meddelande i tråden valdes bort: `order_messages` är affärens
kommunikationsprotokoll och används vid tvist, där ett robotsvar hade varit
omöjligt att skilja från ett riktigt svar från admin. Det hade dessutom gått
genom `notify_order_message` och mejlat parten om ett svar som ingen skrivit.

Första halvan av texten är ett påstående om systemet, inte ett löfte: triggern
skapar en notis till varje admin vid meddelande från en part, och notisen går
vidare till mejl. Andra halvan är ett löfte, och det är bara användaren som kan
ändra det. Blir svarstiden en annan är det raden som ska ändras, inte
verkligheten som ska ursäktas.

---

## Kända brister

Funna i en genomgång av hela kodbasen 2026-08-30. **Tjugonio är åtgärdade:
tre i PR #260, en i #262, en i #263, en i #264, två i #269, en i #270, sex i
#271, två i #273, sex i #274, en i #275 och fem i #283.** Punkt 30 är inget
fynd längre. **Listan är därmed genomgången.**
Ta inte tag i något här utan att fråga först, flera rör spärrade filer.

**Rör pengar eller juridik**

1. ~~Juristvarningen i `components/LegalPage.tsx`.~~ **Åtgärdad i PR #260.**
2. ~~`lib/terms.ts` var inte höjd.~~ **Åtgärdad i PR #260**, versionen är
   `2026-08-29`, samma dag som villkoren senast ändrades i sak.
3. ~~Kravet på BankID, ägarintyg och förmedlingsuppdrag fanns bara i klienten.~~
   **Åtgärdad i PR #264.** `enforce_listing_requirements` är skriven och
   **körd mot databasen 2026-08-30**, verifierad i `pg_trigger`. Se
   beslutsloggen för hur den är avgränsad.
   **Bevisad genom genomklickning samma dag:** ett föremål lades ut via
   formuläret och gick igenom. Eftersom spärren kräver uppdrag, villkorsversion,
   ägarintyg, ursprung och identitet är det samtidigt bevisat att
   `submit/page.tsx` faktiskt skickar alla fem fälten. Mejlet "Nytt föremål att
   granska" nådde fram, så hela kedjan från trigger via webhook till Resend är
   verifierad i drift efter rotationen av `EMAIL_WEBHOOK_SECRET`.
4. ~~Återlistning skapade föremål utan uppdrag.~~ **Åtgärdad i PR #260.**
   Ursprunget ärvs, medan ägarintyg och uppdrag sätts på nytt eftersom
   publiceringen är instruktionen.
5. ~~Beloppskontrollen urkopplad när leverantören inte var Stripe.~~
   **Åtgärdad i PR #262**, Brite är borttagen och Stripe är enda leverantören.
6. ~~`paymentsConfigured()` kontrollerade aldrig webhook-hemligheten.~~
   **Åtgärdad i PR #263.** Båda halvorna krävs nu, så betalningen öppnas aldrig
   om den inte kan kvitteras.
7. ~~Callbacken kontrollerar aldrig `order.status` eller `refunded_at`.~~
   **Åtgärdad i PR #269.** En krediterad eller avbruten affär settlas aldrig.
   Kontrollen ligger före idempotenskontrollen, eftersom krediteringen nollar
   `dealer_paid_at`.
8. ~~`/api/payments/create` skriver över en `amount_mismatch`-flagga, och en
   andra betalning registreras aldrig.~~ **Åtgärdad i PR #269.** Rutten
   vägrar öppna en ny session på en flaggad order, och callbacken skiljer nu
   en omleverans av samma session från en betalning via en annan session.
   Kvar med avsikt: två sessioner kan fortfarande vara öppna samtidigt, se
   beslutsloggen.
9. ~~Fakturorna räknar om beloppen vid varje visning.~~ **Åtgärdad i PR #270.**
   `lib/fees.ts` är en daterad historik, och allt som rör en befintlig affär
   läser `feesAt(order.created_at)`. Se affärsmodellen ovan.

**Rör personuppgifter och identitet**

10. ~~`GET /api/orders/[id]/seller` lämnar ut säljarens personnummer och
    adress så snart ordern finns, utan kontroll och utan loggning.~~
    **Åtgärdad i PR #271.** Grinden ligger i `lib/identityRelease.ts` och
    delas med `invoice-pdf`, som hade samma läcka utan att stå i listan.
    Kräver körd SQL, se nedan.
11. ~~`verified_ssn` saknar unikt index.~~ **Åtgärdad i PR #271.** Personnumret
    normaliseras till tolv siffror innan det lagras, och ett partiellt unikt
    index binder det till ett konto. **Kräver körd SQL.**
12. ~~`lib/idura.ts` faller tillbaka på `payload.sub` som personnummer.~~
    **Åtgärdad i PR #271.** Reserven är borttagen och numret måste klara
    Luhn-kontrollen i `lib/identity.ts`.
13. ~~`id_token` signaturverifieras inte.~~ **Åtgärdad i PR #271.** RS256 mot
    leverantörens JWKS, med issuer och nycklar hämtade ur discovery-dokumentet.
14. ~~`/api/notify-email` litar på POST-body när `record.id` saknas.~~
    **Åtgärdad i PR #271.** Innehållet läses alltid ur databasen.
15. ~~`EMAIL_WEBHOOK_SECRET` accepteras som `?secret=` i bildverktyget.~~
    **Åtgärdad i PR #271.** Bara inloggad admin med Bearer.

**SQL:en för 10 och 11 är körd mot databasen 2026-08-31, och kontrollerad.**
Ligger sist i `supabase-schema.sql`: det unika indexet på `verified_ssn` och
tabellen `identity_disclosures`. Båda är bekräftade genom att fråga
`pg_indexes` och `pg_tables` efteråt: indexet `profiles_verified_ssn_unique`
finns, och `identity_disclosures` finns med `rowsecurity = true`.

Att tabellen finns är inte en formalitet. Utan den svarar utlämnandet 500 och
handlaren får "Privatperson" i stället för säljarens namn på inköpsunderlaget,
eftersom loggen skrivs före utlämnandet och stoppar det om den misslyckas.

**Trasig funktion**

16. ~~`dealer_paid` är ett återvändsgränd-tillstånd.~~ **Åtgärdad i PR #274.**
    `stepIndex` mappar det utfasade värdet till `received`, steget det
    historiskt kom efter, så nästa steg blir `verified_paid`.
17. ~~Ordervyn hämtar inte `seal_number` eller `cancel_reason` men läser dem.~~
    **Åtgärdad i PR #274.** Båda är med i select:en nu.
18. ~~Adminpanelen anropar `settle_ended_auctions` men rätten är återkallad.~~
    **Åtgärdad i PR #274.** Går via `/api/admin/settle-auctions` med
    servicerollen. Återkallandet i schemat står kvar, det är djupförsvar.
19. ~~Sjätte bilden är osynlig.~~ **Åtgärdad i PR #274.** Galleriet har sex
    kolumner och kapar inte längre.
20. ~~Sidfotens länk "Bli guldhandlare" landar på inloggningsfliken.~~
    **Åtgärdad i PR #274.** Länken bär `mode=register`, som sidan redan läser.
21. ~~Personnummerfältet kräver tio siffror men ber om tolv.~~ **Åtgärdad i
    PR #274.** Båda formerna godtas, kontrollsiffran kontrolleras, och numret
    lagras normaliserat precis som från BankID.

**Rör löftet om ärliga siffror**

22. ~~`LiveGoldPrice.tsx` lägger på tre sinusvågor och visar en påhittad
    dagsförändring.~~ **Åtgärdad i PR #273.** Vågorna och sparklinen är borta,
    och komponenten visar leverantörens verkliga `changePct`, eller ingenting
    när den saknas.
23. ~~"Metallvärde vid dagens kurs" använder konstanten 1295 kr per gram.~~
    **Åtgärdad i PR #273.** Samtliga sju anropsställen skickar nu in
    live-kursen. Konstanten finns kvar enbart som reservvärde i `lib/gold.ts`
    och som startvärde i `useGoldPrice`.
24. ~~`components/HomeContent.tsx:344` säger "BankID-verifierade handlare".~~
    **Åtgärdad i PR #275**, genom att göra påståendet sant i stället för att ta
    bort det. Handlaren måste nu legitimera sig, spärrat i `dealer_may_bid`.
    Texten får stå i presens av samma skäl som villkoren: inga riktiga affärer
    släpps igenom före lansering, och kravet skärps samma dag som BankID.

**Städning**

25. ~~180 tankstreck i 54 filer.~~ **Åtgärdad i PR #283.** Noll kvar i koden.
    Två av dem satt i SQL-strängar, se nedan.
26. ~~`README.md` och `ATT-GORA.md` är kraftigt föråldrade.~~ **Åtgärdad i
    PR #283.** README beskriver koden som den ser ut, och ATT-GORA speglar det
    verkliga läget med två punkter uttryckligen märkta som obekräftade.
27. ~~Död kod.~~ **Åtgärdad i PR #283.** `CountUp.tsx` och `HeroButtons.tsx`
    borttagna, `totalWithCommission` och `PAYMENT_WINDOW_LABEL` ur `lib/fees.ts`.
28. ~~Bolagsuppgifterna kopierade till tre ställen.~~ **Åtgärdad i PR #283.**
    Källan är `lib/company.ts`. De två villkorstexterna är orörda, de är
    spärrade filer och har numret i löptext.
29. ~~`lib/types.ts` ur synk med databasen.~~ **Åtgärdad i PR #283.** Fjorton
    kolumner på `profiles` och sju på `items` saknades. Nullable skrivs nu som
    `| null`, vilket direkt fångade tre ställen där en nullbar kolumn skickades
    till en prop som inte tillät null.

**Två tankstreck satt i SQL-strängar och är därför inte borta i databasen.**
`process_unpaid_orders` skriver `cancel_reason` och `notify_bidders_ending_soon`
sätter en notistitel. Filen är rättad, men de gamla strängarna ligger kvar i
databasen tills funktionerna körs om. Det är rent kosmetiskt: mejlrutten filtrerar
på delsträngarna "överbjuden" och "snart slut", som båda finns kvar.
30. ~~`docs/aml-policy.md` använder GuldBud AB.~~ **Inte längre ett fynd.**
    Ändrades i PR #281 och revertades i PR #282: användaren har bestämt att
    det ska stå GuldBud AB överallt. Se affärsfakta.
