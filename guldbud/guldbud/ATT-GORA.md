# Att göra innan lansering

Levande checklista. Den gamla versionen av den här filen var från ett tidigt
skede och stämde inte längre: den bad om att byta ut adressen "Storgatan 1" som
inte finns kvar i koden, och om att godkänna handlare för hand i Supabase, vilket
görs i adminpanelen sedan länge.

**Fyll aldrig i ett värde här som du inte kontrollerat.** Står det obekräftat ska
det stå kvar tills någon faktiskt tittat.

---

## På kritiska linjen

De här hänger ihop. Ingen riktig affär får släppas igenom förrän alla är klara.

- [ ] **Namnbyte till GuldBud AB.** Inskickat till Verksamt, inte genomfört.
      Villkoren, förmedlingsuppdraget och fakturadokumenten är redan skrivna för
      det namnet, så tjänsten kan inte öppnas för transaktioner innan bytet gått
      igenom.
- [ ] **Klientmedelskonto hos SEB.** Inte skapat. Handlarens betalning ska tas
      emot avskilt från bolagets egna medel, och Stripes utbetalningar ska gå
      dit, inte till rörelsekontot. Görs det inte hamnar de första riktiga
      utbetalningarna fel, vilket är precis den sammanblandning upplägget ska
      förhindra.
- [ ] **Skarpa Stripe-nycklar.** Testnycklar ligger i Vercel sedan 2026-08-26.
      Byt `STRIPE_SECRET_KEY` och sätt upp webhooken skarpt, så att
      `STRIPE_WEBHOOK_SECRET` matchar. Betalningen öppnas inte alls utan båda,
      med avsikt: en betalning som inte kan kvitteras är värre än ingen.
- [ ] **BankID skarpt.** Tre saker samma dag, annars säger klienten och
      databasen olika saker:
      1. Skarp `IDURA_DOMAIN` och `NEXT_PUBLIC_BANKID_ENABLED=true` i Vercel,
         plus omdeploy
      2. Ta bort or-grenen i `dealer_may_bid`
      3. Ta bort or-grenen i `enforce_listing_requirements`
      Färdiga SQL-block finns i beslutsloggen i `CLAUDE.md`. Tjänsten kostar
      från att den aktiveras, därför sist.

---

## Städning i Vercel

- [ ] **Ta bort `PAYMENT_PROVIDER` och de sex `BRITE_`-variablerna.** Brite är
      borttagen ur koden, så de läses inte längre av någonting.

---

## Dokument som behöver en människa

- [ ] **`docs/aml-policy.md` är märkt utkast 0.1.** Dokumentägare,
      AML-ansvarig och fastställandedatum är tomma fält. Dokumentet säger själv
      att den formella klassningen av verksamheten och frågan om
      registreringsplikt ska granskas av en compliance- eller juristresurs innan
      det tas i bruk.
- [ ] **Revisorns bekräftelse av förmedlarrollen.** Hela momsupplägget bygger på
      att varuledet mellan privatperson och handlare är momsfritt och att
      tjänsteledet mellan GuldBud och handlare är momspliktigt.

---

## Obekräftat, kontrollera innan lansering

Det här vet vi inte statusen på. Kolla, och skriv in svaret här.

- [ ] **Supabase Auth och e-post.** Transaktionsmejlen via `/api/notify-email`
      och Resend är verifierade i drift 2026-08-30. Men om Supabases egna
      auth-mejl, alltså kontobekräftelse och lösenordsåterställning, går via
      egen SMTP eller fortfarande via Supabases testmejl är inte kontrollerat.
      Går de via testmejlet stryps de vid volym och hamnar i skräpposten.
- [ ] **"Confirm email" i Supabase.** Var avstängd under test för att komma runt
      e-postgränsen. Om den fortfarande är det kan vem som helst registrera sig
      på en adress de inte äger. Kontrollera och slå på den.

---

## Redan klart

Skrivs upp här så det inte görs om.

- SNI-koden ändrad till 47.910, Förmedling
- Momsregistrering bekräftad mot Skatteverket, SE559291478101
- Postboxen mottagen från PostNord, Box 6007, 102 31 Stockholm
- Trustpilot-profilen hävdad, se.trustpilot.com/review/guldbud.com
- Kedjan trigger via webhook till Resend verifierad i drift
- Adminpanelen godkänner handlare och föremål, ingen handpåläggning i Supabase
