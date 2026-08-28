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
