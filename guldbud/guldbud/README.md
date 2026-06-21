# GuldBud 🏆

Auktionsplattform för guldföremål – privatpersoner lägger ut föremål, godkända guldhandlare budar.

## Snabbstart

### 1. Installera beroenden
```bash
npm install
```

### 2. Skapa Supabase-projekt

1. Gå till [supabase.com](https://supabase.com) och skapa ett gratis konto
2. Skapa ett nytt projekt
3. Gå till **SQL Editor** och kör hela innehållet i `supabase-schema.sql`
4. Gå till **Settings → API** och kopiera:
   - Project URL
   - anon/public key
   - service_role key

### 3. Miljövariabler

Kopiera `.env.local.example` till `.env.local` och fyll i dina Supabase-uppgifter:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://ditt-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=din-anon-key
SUPABASE_SERVICE_ROLE_KEY=din-service-role-key
```

### 4. Kör lokalt

```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000)

---

## Publicera på Vercel (gratis)

1. Pusha koden till GitHub
2. Gå till [vercel.com](https://vercel.com) och importera repot
3. Lägg till samma miljövariabler under **Settings → Environment Variables**
4. Klicka **Deploy** – du får en publik länk direkt!

---

## Flöde

### Privatperson (kund)
1. Besöker startsidan utan inloggning
2. Klickar "Lägg ut ett föremål"
3. Laddar upp foton + fyller i info
4. Förfrågan granskas av admin
5. När godkänd → auktionen öppnar och handlare kan buda

### Guldhandlare
1. Registrerar sig med företagsnamn
2. Väntar på manuellt godkännande (du godkänner i Supabase)
3. Loggar in → ser dashboard med alla aktiva auktioner
4. Lägger bud direkt i dashboarden

### Godkänna en handlare (som admin)
Gå till Supabase → Table Editor → `profiles` → ändra `approved` till `true` för handlarens rad.

---

## Projektstruktur

```
app/
  page.tsx              – Startsida med auktioner
  auth/
    login/page.tsx      – Inloggning + registrering
    pending/page.tsx    – Väntar på godkännande (handlare)
  customer/
    submit/page.tsx     – Lägg ut föremål + bilduppladdning
  dealer/
    dashboard/page.tsx  – Handlarens dashboard med budgivning
  auctions/
    [id]/page.tsx       – Enskild auktionssida

components/
  Navbar.tsx            – Header med dynamisk navigation
  AuctionCard.tsx       – Kort för auktionslisting
  BidSection.tsx        – Budgivningsformulär (client component)

lib/
  supabase-browser.ts   – Supabase-klient (webbläsare)
  supabase-server.ts    – Supabase-klient (server)
  types.ts              – TypeScript-typer

supabase-schema.sql     – Hela databasen, kör i Supabase SQL Editor
```

---

## Teknisk stack

- **Next.js 14** (App Router)
- **Supabase** – databas, auth, fillagring
- **Tailwind CSS** – styling
- **TypeScript**
- **Vercel** – hosting (rekommenderat)
