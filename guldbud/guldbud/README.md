# GuldBud

Auktionsplattform för guldföremål. Privatpersoner lägger ut föremål, godkända
och legitimerade guldhandlare budar. GuldBud är förmedlare och äger aldrig
guldet.

> **Läs `CLAUDE.md` i repotroten först.** Den innehåller arkitekturen,
> datamodellen, affärsmodellen, beslutsloggen och vad som kräver uttrycklig
> instruktion innan det rörs. Den här filen är bara hur du kommer igång.

## Snabbstart

### 1. Installera beroenden

```bash
npm install
```

### 2. Supabase

Kör hela innehållet i `supabase-schema.sql` i **SQL Editor**.

Filen är i huvudsak idempotent, men läs den innan du kör den mot en databas som
redan har data. Den innehåller både tabeller och funktioner som skrivs över.

**Schemafilen är inte samma sak som databasen.** Vill du veta vad som faktiskt
körs, fråga `pg_proc` och `pg_trigger`. Filen och databasen har glidit isär
förut, se beslutsloggen i `CLAUDE.md`.

### 3. Miljövariabler

Det finns ingen `.env.local.example` i repot. Variablerna sätts i Vercel, och
namnen är listade i `CLAUDE.md` under Miljövariabler. Värden står aldrig i repot.

För att köra lokalt behöver du minst dessa i `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Utan de övriga stängs funktioner av på ett kontrollerat sätt i stället för att
gå sönder: betalningen svarar 503 utan Stripe-nycklar, AI-förslaget döljs utan
`ANTHROPIC_API_KEY`, och BankID svarar `ej_konfigurerad` utan Idura-variablerna.

### 4. Kör lokalt

```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000).

### Verifiering

```bash
npx tsc --noEmit
npm run build
```

Det finns inga automatiska tester. Ett flöde är bevisat först när någon klickat
igenom det på riktigt.

---

## Drift

Vercel bygger och publicerar automatiskt vid merge till `main`.

En `NEXT_PUBLIC_`-variabel bakas in vid bygget. Ändrar du en måste sajten
deployas om, annars fortsätter den gamla värdet gälla i webbläsaren.

---

## Flöde

### Säljaren (privatperson)

1. Registrerar sig med namn, e-post och lösenord
2. Kompletterar adress och utbetalningsuppgifter vid första listningen
3. Legitimerar sig med BankID
4. Lägger ut ett föremål med 2 till 6 bilder, ursprungsval och ägarintyg
5. Admin granskar och aktiverar auktionen
6. Accepterar eller avböjer högsta budet när auktionen är slut
7. Skickar in föremålet och får betalt

### Handlaren

1. Registrerar sig med fullt företagsformulär
2. Väntar på manuellt godkännande av admin
3. Legitimerar sig med BankID
4. Budar från auktionssidan eller handlarpanelen, med autobud om hen vill
5. Betalar vid vunnen auktion och tar emot föremålet

### Admin

`/admin` är kontrollrummet: godkänna handlare och föremål, styra auktioner,
godkänna vinnande bud åt säljaren, och nyckeltal. `/admin/orders/[id]` är
affärsvyn med statusstege, ekonomi, penningtvättsbeslut och tvister.

Handlare godkänns i adminpanelen, inte genom att ändra `approved` för hand i
Supabase.

---

## Projektstruktur

Ungefärlig omfattning: 49 sidor, 13 API-rutter, 39 komponenter, 17 filer i
`lib/`, och ett schema på drygt 1900 rader.

```
app/
  api/             payments, bankid, notify-email, gold-price,
                   suggest-listing, orders, admin
  admin/           adminpanelen, affärsvyn, övervakningen
  auctions/        listan och den enskilda auktionen
  customer/        listningsflödet, mina föremål, profil, uppdragskvitto
  dealer/          handlarpanelen, profil, guide
  orders/          affären, fakturasidan
  guider/          20 SEO-artiklar, alla byggda på components/GuideShell
  terms/, handlarvillkor/, privacy/

components/        39 komponenter

lib/
  fees.ts          avgifter och moms, en daterad historik
  orders.ts        statusstegen i en affär
  identity.ts      personnummer och BankID-flaggan
  gold.ts          guldvärde och kursberäkning
  company.ts       bolagsuppgifterna
  payments/        betalleverantören, Stripe
  pdf/             dokumenten som PDF

supabase-schema.sql   tabeller, RLS, triggers, spärrar, cron
```

### Var behörigheten sitter

`middleware.ts` skyddar **ingen** rutt. Den förnyar bara sessionen. Alla
rollgrindar på sidnivå är klientkod, och klienten pratar med Supabase direkt.

**All verklig auktorisering ligger i RLS-policyerna i schemat.** Ändrar du en
policy ändrar du säkerheten. Ändrar du en klientgrind ändrar du bekvämligheten.

---

## Teknisk stack

- Next.js 14, App Router
- TypeScript
- Tailwind CSS
- Supabase: databas, auth, lagring
- Vercel: drift
- Stripe: kortbetalning
- Resend: transaktionsmejl
- BankID via Idura, OIDC med PKCE
