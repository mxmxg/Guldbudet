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

**Beslutat: vilket namn som ska stå var**

- **Villkor, förmedlingsuppdrag och fakturadokument skrivs för GuldBud AB.**
  De används först vid transaktioner, och inga transaktioner tillåts innan
  namnbytet gått igenom. Rätta alltså inte tillbaka dem till det gamla namnet.
- **Handlingar som skickas ut före namnbytet använder det registrerade
  namnet**, med en not om att bytet pågår. Det gäller underlaget till
  revisorn, bankansökan och allt som en mottagare slår upp i registret. Ett
  namn som inte matchar registret stoppar ärendet.

Följden av beslutet: namnbytet ligger nu på kritiska linjen. Tjänsten kan inte
öppnas för transaktioner förrän Verksamt är klart, eftersom de juridiska
handlingarna förutsätter det.

**Inget riktigt föremål släpps igenom före lansering. Sluta ta upp det.**

Varje föremål skapas som `pending` och måste godkännas manuellt av admin
innan det blir aktivt. Användaren är admin och släpper igenom ingenting
förrän BankID är skarpt, klientmedelskontot är öppnat och namnbytet är klart.

Det betyder att villkor och dokument får beskriva tjänsten som den fungerar
vid lansering, i presens, utan reservationer. Påpeka alltså **inte** varje
gång att BankID ligger i testläge eller att kontot inte är öppnat. Det är
redan hanterat av att ingenting släpps igenom. Undantaget är handlingar som
skickas till utomstående före lansering, se ovan.

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
- **Kontot är ännu inte skapat.** Skriv därför aldrig om upplägget i presens
  som om det redan gäller. Det är den beslutade ordningen, inte nuläget.
- Detta ligger på kritiska linjen före lansering: skapas inte kontot, och
  sätts det inte som mottagare i Stripe, hamnar de första riktiga
  utbetalningarna på rörelsekontot. Då sker precis den sammanblandning
  upplägget ska förhindra.
- Kortbetalning via Stripe är en **tillfällig lösning**. Planen är direkt
  banköverföring när avtal finns.

**Leverantörer**

- Vercel (drift), Supabase (databas, auth, lagring)
- Stripe (kortbetalning), under granskning sedan 2026-08-28 i kategorin
  ädelmetaller. Live-nycklar är ännu inte inlagda i Vercel.
- Brite (direkt banköverföring). Adaptern finns byggd i `lib/payments/brite.ts`
  men är inte färdig: elva öppna TODO om att API-kontraktet ännu inte är
  bekräftat mot Brites dokumentation. Brite är dessutom **standardvalet i
  koden**, se beslutsloggen.
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
bankid-callbacken, betalrutterna, fakturarutterna, mejlrutten och
bildverktyget. Den lämnar aldrig servern.

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

1. Säljaren accepterar. `enforce_accepted_bid_valid` kontrollerar att budet är
   det högsta och tillhör föremålet. `notify_bid_accepted` skapar ordern med
   `payment_due_at = now() + interval '1 day'`.
2. `set_order_aml_status` sätter `clear` eller `review` direkt vid orderns
   skapande. Trösklar: 25 000 kr per affär, 50 000 kr rullande 12 månader.
3. Handlaren startar betalningen via `/api/payments/create`, som väljer
   leverantör ur `PAYMENT_PROVIDER` och skriver `payment_status = 'pending'`.
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
2. `NEXT_PUBLIC_BANKID_ENABLED` avgör om BankID är **obligatoriskt** för att
   lista ett föremål. Den läses på exakt ett ställe, `submit/page.tsx:65`.

De två kan glida isär åt båda håll. Utan BankID faller listningsgrinden
tillbaka på ett självdeklarerat personnummer utan checksiffrekontroll.

Penningtvättspolicyn ligger i `docs/aml-policy.md` och är märkt som utkast med
tomma fält för dokumentägare och fastställandedatum.

---

## Miljövariabler

27 stycken. Namnen står här, aldrig värden. De sätts i Vercel.

**Publika**, bakas in i webbläsarbundlen: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_BANKID_ENABLED`, `NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM`.

En `NEXT_PUBLIC_`-variabel kan aldrig vara hemlig, och den läses vid bygget.
Ändrar du en måste sajten deployas om.

**Hemliga**: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`,
`EMAIL_WEBHOOK_SECRET`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `TRUSTPILOT_AFS_BCC`,
`ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `IDURA_DOMAIN`, `IDURA_CLIENT_ID`,
`IDURA_CLIENT_SECRET`, `PAYMENT_PROVIDER`, `STRIPE_SECRET_KEY`,
`STRIPE_API_BASE`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CURRENCY`,
`BRITE_API_KEY`, `BRITE_API_BASE`, `BRITE_WEBHOOK_SECRET`,
`BRITE_CREATE_PATH`, `BRITE_CURRENCY`, `BRITE_SIGNATURE_HEADER`.

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
på en plan utan transformering.

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
och `/customer/items/[id]/uppdrag` renderar kvittot i efterhand ur
`mandate_accepted_at` och `terms_version`.

**Priset justeras inte efter kontroll, det omförhandlas.** Tidigare sa
villkoren att priset "kan justeras", vilket beskriver en köpare och inte en
förmedlare. Nu lämnar handlaren ett nytt bud som säljaren får acceptera eller
avböja. GuldBud fastställer aldrig priset.

**Bildkrympningen i adminpanelen** (`/api/admin/optimize-images`) byggdes för
att krympa redan uppladdade råa telefonfoton innan transformeringen fanns. Den
skriver över originalen. Med transformeringen på är originalet det som
Supabase skalar ifrån, så verktyget förstör numera sin egen förutsättning.

---

## Kända brister

Funna i en genomgång av hela kodbasen 2026-08-30. **Ingen av dem är åtgärdad.**
Ta inte tag i något här utan att fråga först, flera rör spärrade filer.

**Rör pengar eller juridik**

1. `components/LegalPage.tsx:66` visar publikt på `/terms`,
   `/handlarvillkor` och `/privacy` att dokumentet "behöver granskas av jurist
   innan lansering".
2. `lib/terms.ts` är inte höjd sedan villkoren ändrades i sak i PR #254 och
   #255. Varje nytt föremål stämplas med fel `terms_version`.
3. Kravet på BankID, ägarintyg och förmedlingsuppdrag finns bara i
   `app/customer/submit/page.tsx`. RLS-policyn på `items` kräver bara ägarskap,
   och kolumnerna är nullable. Ett anrop förbi den sidan tar med sig hela den
   rättsliga konstruktionen.
4. Återlistning i `DeclineBid.tsx:52` och `my-items:43` skapar nya föremål utan
   `mandate_accepted_at`, `terms_version`, `source_type` och
   `ownership_attested_at`.
5. Beloppskontrollen i betalcallbacken är helt urkopplad om `PAYMENT_PROVIDER`
   inte är exakt strängen `stripe`. Brite är standardvalet och returnerar
   aldrig något belopp.
6. `paymentsConfigured()` kontrollerar aldrig webhook-hemligheten. Med API-nyckel
   men utan hemlighet kan handlare betala medan varje callback avvisas.
7. Callbacken kontrollerar aldrig `order.status` eller `refunded_at`. En sen
   callback kan markera en krediterad eller avbruten affär som betald.
8. `/api/payments/create` blockerar bara på `dealer_paid_at`. Två parallella
   sessioner kan båda betalas, och den andra betalningen registreras aldrig.
   Samma lucka skriver över en `amount_mismatch`-flagga med `pending`.
9. Fakturorna räknar om beloppen vid varje visning. Ändras `lib/fees.ts` får
   gamla fakturor nya belopp.

**Rör personuppgifter och identitet**

10. `GET /api/orders/[id]/seller` lämnar ut säljarens personnummer och adress
    så snart ordern finns, utan kontroll av betalning eller avbrott, och utan
    loggning.
11. `verified_ssn` saknar unikt index. Samma BankID kan verifiera obegränsat
    många konton, vilket kringgår den kumulativa penningtvättströskeln.
12. `lib/idura.ts:95` faller tillbaka på `payload.sub` som personnummer om
    ssn-claimen saknas. Kontrollen på rad 107 fångar det inte.
13. `id_token` signaturverifieras inte, TODO på `lib/idura.ts:82`.
14. `/api/notify-email` litar på POST-body när `record.id` saknas. Med
    hemligheten kan godtyckligt GuldBud-mejl skickas till valfri användare.
15. `EMAIL_WEBHOOK_SECRET` accepteras som `?secret=` i bildverktyget och hamnar
    därmed i loggar. Samma hemlighet skyddar mejlwebhooken.

**Trasig funktion**

16. `dealer_paid` är ett återvändsgränd-tillstånd. `stepIndex` ger minus ett,
    så admin kan inte flytta en sådan affär framåt, bara avbryta den.
17. `orders/[id]/page.tsx:58` hämtar inte `seal_number` eller `cancel_reason`,
    men raderna 255, 395 och 397 läser dem. Förseglingsnumret visas aldrig.
18. `app/admin/page.tsx:220` anropar `settle_ended_auctions`, men schemat
    återkallar exekveringsrätten från `authenticated` på rad 1692. Anropet
    misslyckas tyst.
19. Sjätte bilden är osynlig. Säljaren får ladda upp sex, galleriet visar fem.
20. Sidfotens länk "Bli guldhandlare" landar på inloggningsfliken utan väg till
    handlarregistrering.
21. Personnummerfältet kräver tio siffror men ber om tolv i platshållaren.

**Rör löftet om ärliga siffror**

22. `LiveGoldPrice.tsx:9` lägger på tre sinusvågor ovanpå baspriset och visar
    en påhittad dagsförändring. Den renderas på `/guider/guldpris-idag`, en
    sida som utger sig för att visa faktiskt guldpris. `GoldTicker.tsx:12`
    tog uttryckligen bort samma sak med motiveringen att den krockade med
    löftet om ärliga siffror.
23. "Metallvärde vid dagens kurs" använder inte dagens kurs utan konstanten
    1295 kr per gram. Gäller `AuctionDetails`, `dealer/dashboard`, `admin` och
    `overvakning`. Bara `ValueEstimator` använder live-priset.
24. `components/HomeContent.tsx:344` säger "BankID-verifierade handlare".
    Handlare går aldrig genom BankID-flödet.

**Städning**

25. 180 tankstreck på 176 rader i 54 filer.
26. `README.md` och `ATT-GORA.md` är kraftigt föråldrade.
27. Död kod: `components/CountUp.tsx`, `components/HeroButtons.tsx`,
    `totalWithCommission` och `PAYMENT_WINDOW_LABEL` i `lib/fees.ts`.
28. Bolagsuppgifterna är kopierade till tre ställen i stället för importerade.
29. `lib/types.ts` är ur synk med databasen och kringgås med `any`.
30. `docs/aml-policy.md` använder GuldBud AB, men är ett dokument för
    utomstående och ska då ha det registrerade namnet.
