# GuldBud, pengaflöde och förmedlingsuppdrag

Underlag för juridisk bedömning enligt lagen om betaltjänster.
Upprättat 2026-09-07. Tjänsten är byggd men inte i drift. Noll riktiga
affärer har genomförts.

**Bolag:** org.nr 559291-4781. Verksamheten drivs under namnet GuldBud,
guldbud.com. Namnbyte till GuldBud AB är inskickat till Verksamt men ännu
inte genomfört, så bolaget heter fortfarande Hey Consulting Nordic AB i
registret.

---

## 1. Vad tjänsten gör

GuldBud är en marknadsplats där en privatperson säljer begagnade
guldföremål till en av oss granskad guldhandlare genom budgivning.

- Säljaren är alltid privatperson.
- Köparen är alltid ett företag som vi godkänt manuellt mot
  organisationsnummer innan det får lägga bud, och vars företrädare har
  legitimerat sig med BankID.
- Föremålet är begagnat guld, typiskt smycken.

## 2. Vår roll enligt villkoren

Ur `app/terms/page.tsx`, ordagrant:

> "När du som privatperson använder GuldBud för att sälja ett föremål ger du
> GuldBud i uppdrag att förmedla försäljningen i ditt namn och för din
> räkning till en godkänd handlare. GuldBud är därmed förmedlare och
> plattform och är inte köpare eller säljare av föremålet."

> "Det köp som uppstår genom tjänsten ingås mellan dig som säljare och den
> vinnande handlaren. GuldBud är inte part i köpeavtalet mellan säljaren och
> handlaren."

> "'Förmedlingsuppdraget' avser det uppdrag du lämnar GuldBud att förmedla
> försäljningen av föremålet i ditt namn och för din räkning. Uppdraget
> lämnas när du publicerar ett föremål i tjänsten."

> "GuldBud fastställer inte priset, utan förmedlar parternas nya
> överenskommelse på samma sätt som den ursprungliga."

Uppdraget är inte ett separat avtal utan en del av användarvillkoren, som
godkänns vid registrering. **Varje enskild publicering loggas** i databasen
med tidpunkt (`items.mandate_accepted_at`) och vilken version av villkoren
som gällde (`items.terms_version`). Uppdragskvittot kan tas fram i efterhand
per föremål.

GuldBud äger aldrig föremålet, köper det aldrig och säljer det aldrig
vidare för egen räkning.

## 3. Ersättningsmodellen

- Säljaren betalar ingenting. Säljaren får hela det accepterade budet utan
  avdrag.
- Handlaren betalar budet plus en köparprovision om **8 procent av budet**,
  plus 25 procent moms på provisionen, plus frakt 199 kr inklusive moms.
- Provisionen är GuldBuds enda intäkt från affären.

Räkneexempel, bud 30 000 kr:

| Post | Belopp | Vems pengar |
|---|---|---|
| Föremålet, till säljaren | 30 000,00 kr | Säljarens |
| Köparprovision 8 procent | 2 400,00 kr | GuldBuds intäkt |
| Moms på provisionen | 600,00 kr | Utgående moms |
| Frakt exklusive moms | 159,20 kr | GuldBuds intäkt |
| Moms på frakten | 39,80 kr | Utgående moms |
| **Handlaren betalar totalt** | **33 199,00 kr** | |

Alltså: av 33 199 kr är **30 000 kr säljarens pengar** och 3 199 kr GuldBuds
del inklusive moms.

Varuledet mellan privatperson och handlare är momsfritt. Tjänsteledet mellan
GuldBud och handlaren är momspliktigt. Tre separata dokument utfärdas per
affär: säljarens underlag, handlarens inköpsunderlag, och GuldBuds faktura
på provision och frakt. Momsnumret visas endast på den sista.

## 4. Pengaflödet som det är byggt idag

1. Säljaren publicerar föremålet. Uppdraget lämnas i det ögonblicket.
2. Godkända handlare budar. Budgivningen pågår 48 timmar.
3. Säljaren accepterar ett bud. **Köpet uppstår mellan säljaren och
   handlaren.** En affär skapas i systemet.
4. Handlaren faktureras hela summan, 33 199 kr i exemplet, och betalar via
   **banköverföring till GuldBuds klientmedelskonto hos SEB**, avskilt från
   bolagets egna medel, med affärens referensnummer.
5. GuldBud prickar av betalningen manuellt.
6. Säljaren skickar föremålet till GuldBud i ett rekommenderat, försäkrat
   brev som GuldBud betalar.
7. GuldBud tar emot och äkthetskontrollerar föremålet.
8. GuldBud betalar ut **hela budet, 30 000 kr, till säljarens bankkonto**
   från klientmedelskontot.
9. GuldBud skickar föremålet vidare till handlaren.
10. GuldBuds egen del, 3 199 kr, förs över till bolagets driftkonto.

Pengarna ligger alltså på klientmedelskontot mellan steg 4 och steg 8.

## 5. Var föremålet befinner sig

| Steg | Guldet finns hos |
|---|---|
| 1 till 5 | Säljaren |
| 6 | På posten, försäkrat |
| 7 till 8 | GuldBud |
| 9 och framåt | Handlaren |

**GuldBud har guldet i sin besittning under hela den period då pengarna
ligger på klientmedelskontot.** Handlaren får aldrig föremålet innan
säljaren fått betalt.

## 6. Spärrar som redan finns i systemet

- Handlaren måste vara godkänd av GuldBud och legitimerad med BankID innan
  hen får buda. Kontrollen ligger som ett villkor i databasen, inte bara i
  gränssnittet.
- Säljaren måste vara legitimerad med BankID innan ett föremål får
  publiceras. BankID-legitimeringen är byggd (Idura och Criipto) och ligger
  i testläge tills lanseringsdagen, eftersom tjänsten kostar från
  aktivering. Fram till dess accepterar systemet även ett manuellt angivet
  personnummer; den grenen tas bort när BankID aktiveras.
- Säljarens bankkonto verifieras via öppen bank-API (kontoverifiering där
  säljaren loggar in hos sin bank med BankID), så att kontohavaren stämmer
  med den BankID-legitimerade säljaren innan någon utbetalning kan ske.
  Pengarna kan därmed bara hamna hos den registrerade användaren. Detta
  införs före lansering; leverantör (Finshark, Tink eller motsvarande) är
  ännu inte vald.
- Penningtvättsgranskning sker automatiskt när affären skapas, med trösklar
  om 25 000 kr per affär och 50 000 kr sammanlagt per person under rullande
  tolv månader. Ärenden över tröskeln måste granskas manuellt.
- Utbetalning till säljaren är **spärrad i databasen** tills handlarens
  betalning är registrerad och penningtvättsgranskningen är godkänd.
  Spärren går inte att kringgå från gränssnittet.
- Varje gång säljarens identitetsuppgifter lämnas ut till handlaren, vilket
  krävs för handlarens inköpsunderlag, loggas det. Går loggen inte att
  skriva sker inget utlämnande.

---

## 7. Frågorna vi vill ha svar på

1. **Omfattas flödet i avsnitt 4 av lagen om betaltjänster?** Vi tar emot
   handlarens betalning på eget klientmedelskonto, behåller vår provision
   och betalar ut resten till säljaren.

2. **Är undantaget för handelsagent tillämpligt?** 1 kap. 7 § 6 lagen
   (2010:751) om betaltjänster undantar betalningstransaktioner som "sker
   från betalaren till betalningsmottagaren genom en handelskommissionär,
   handelsagent eller liknande uppdragstagare, som för endast betalarens
   eller betalningsmottagarens räkning förhandlar eller ingår avtal om köp
   eller försäljning av varor eller tjänster". Säljaren lämnar ett
   uttryckligt förmedlingsuppdrag att sälja i säljarens namn och för
   säljarens räkning, dokumenterat per föremål. GuldBud är inte part i
   köpeavtalet och fastställer inte priset. Samtidigt betalas provisionen
   av handlaren, och GuldBud granskar och godkänner handlarna. Uppfyller vi
   kravet på att agera för **endast** en parts räkning?

3. **Om undantaget inte är tillämpligt, vilka vägar står öppna?**
   a) Tillstånd hos Finansinspektionen. Vi noterar att undantaget från
      tillståndsplikt (registrerad betaltjänstleverantör) sedan 1 juli 2025
      bara finns kvar för kontoinformationstjänster, så detta torde
      innebära tillstånd som betalningsinstitut.
   b) Ombyggnad enligt avsnitt 8 nedan, så att vi aldrig håller säljarens
      pengar.
   c) Att verka som anmält betaltjänstombud under en licensierad
      betaltjänstleverantör.

4. **Påverkas bedömningen av att vi fysiskt innehar guldet** under hela den
   tid pengarna ligger på klientmedelskontot?

5. **Vad gäller för klientmedelskontot i sig?** Räcker det att medlen är
   avskilda hos bank, eller krävs något ytterligare?

---

## 8. Alternativ vi överväger, om nuvarande upplägg inte håller

Vi tar aldrig emot säljarens pengar. Flödet blir:

1. Som idag till och med att säljaren accepterar budet.
2. GuldBud fakturerar handlaren **endast sin egen provision och frakt**,
   3 199 kr i exemplet, till bolagets driftkonto. Det är GuldBuds egen
   intäkt för GuldBuds egen tjänst.
3. Säljaren skickar in föremålet. GuldBud tar emot och äkthetskontrollerar.
4. **Handlaren betalar 30 000 kr direkt till säljarens bankkonto**, det
   konto som verifierats enligt avsnitt 6 och som vi förmedlar till
   handlaren.
5. Säljaren bekräftar i tjänsten att betalningen kommit.
6. Först då skickar GuldBud föremålet vidare till handlaren.

Tryggheten bevaras genom att GuldBud håller föremålet, inte pengarna.
Handlaren får aldrig guldet innan säljaren fått betalt, och säljaren skickar
in guldet först efter att köpet är bindande.

**Fråga:** löser det upplägget problemet, eller kvarstår bedömningen att vi
bedriver betaltjänstverksamhet?

---

## Bilagor att ta med

- Användarvillkoren i sin helhet, guldbud.com/terms
- Handlarvillkoren, guldbud.com/handlarvillkor
- Ett uppdragskvitto ur adminpanelen, som visar hur ett enskilt uppdrag
  dokumenteras
- Utkast till penningtvättsrutin, `docs/aml-policy.md`
