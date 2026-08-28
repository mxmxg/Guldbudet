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

**Adresser, tre olika och lätta att blanda ihop**

- **Registrerad adress:** Kvarnvingevägen 2, 177 41 Järfälla. Den som gäller
  mot Bolagsverket, Skatteverket och vid verifieringar hos leverantörer.
- **Postbox:** Box 6007, 102 31 Stockholm. Dit guldet skickas. Ligger i
  sidfoten och i fraktinstruktionerna.
- E-post: info@guldbud.com

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
