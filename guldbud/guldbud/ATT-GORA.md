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

- [x] **Namnbytet är genomfört.** Bolaget heter **Guldbud Sverige AB** sedan
      2026-09-11, registrerat av Bolagsverket i ärende 477319/2026. Namnet
      "GuldBud AB" avslogs som för generiskt och har aldrig funnits. Villkoren,
      förmedlingsuppdraget, fakturadokumenten och penningtvättsrutinen är
      omskrivna för det registrerade namnet.
- [x] **Adressändringen är genomförd.** Registrerad adress är **Box 6007,
      102 31 Stockholm** sedan 2026-09-11, ärende 479572/2026, samma adress som
      dokumenten redan använde. Den gamla, c/o DIX Revision AB,
      Kvarnvingevägen 2 i Järfälla, gäller inte längre. Ingen kodändring
      behövdes.
- [x] **Betalflödet är väg C sedan 2026-09-15.** Handlaren betalar
      köpeskillingen direkt till säljarens bankkonto och GuldBuds faktura till
      rörelsekontot 5232 10 078 77. GuldBud tar aldrig emot säljarens pengar.
      Klientmedelskontot (öppnat 2026-09-01) används inte i flödet; vad som
      ska hända med det hos SEB är inte avgjort. Stripe är borttaget ur
      bygget.
- [ ] **Kontoverifiering via öppen bank-API.** Lanseringsspärr under väg C:
      handlaren betalar till ett konto vi annars aldrig kontrollerat.
      Leverantör (Tink Account Check eller Finshark) inte vald, inget avtal.
      Tills dess är kontot säljarens egen uppgift och admin kontrollerar det
      mot BankID-namnet i affärsvyn innan handlaren betalar.
- [ ] **Publika texter och villkoren för väg C.** Startsidan, så fungerar det,
      guiderna, FAQ och inlämningsformuläret säger fortfarande att GuldBud
      betalar ut inom 24 timmar, och villkoren beskriver väg A. Nästa PR,
      beslutad 2026-09-15.
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

- [ ] **Ta bort variabler som ingen kod läser:** `PAYMENT_PROVIDER` och de sex
      `BRITE_` (Brite borttagen 2026-08-30), de sex `SWISH_` (Swish borttaget
      2026-09-15) och de fyra `STRIPE_` (Stripe borttaget 2026-09-15).

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

## Redan klart

Skrivs upp här så det inte görs om.

- SNI-koden ändrad till 47.910, Förmedling
- Momsregistrering bekräftad mot Skatteverket, SE559291478101
- Postboxen mottagen från PostNord, Box 6007, 102 31 Stockholm
- Trustpilot-profilen hävdad, se.trustpilot.com/review/guldbud.com
- Kedjan trigger via webhook till Resend verifierad i drift
- Adminpanelen godkänner handlare och föremål, ingen handpåläggning i Supabase
- **"Confirm email" är påslagen** i Supabase, kontrollerat 2026-08-31. Var
  avstängd under test. Bekräftelsemallen är dessutom anpassad på svenska med
  GuldBuds formgivning och rätt bolagsuppgifter i sidfoten. Anonyma
  inloggningar är avstängda, vilket är rätt för oss.
- **Egen SMTP är påslagen**, kontrollerat 2026-08-31. Auth-mejlen går via
  Resend, `smtp.resend.com` på port 465, avsändare `no-reply@guldbud.com` med
  namnet GuldBud. Samma avsändare som notismejlen använder, så en mottagare ser
  ett och samma GuldBud i inkorgen.

  Två saker värda att komma ihåg om den uppsättningen:

  Supabases testmejl används alltså inte, så registreringarna stryps inte av
  dess timgräns. Resends egna gränser gäller i stället, och de beror på
  kontoplanen.

  **Minsta intervall per användare är 60 sekunder.** Begär någon en
  lösenordsåterställning två gånger inom en minut skickas bara den första. Det
  är rimligt som spärr mot missbruk, men förklarar ett supportärende som annars
  ser ut som ett fel.
