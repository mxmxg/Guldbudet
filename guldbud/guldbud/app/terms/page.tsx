import LegalPage from '@/components/LegalPage'

export const metadata = {
  title: 'Användarvillkor · GuldBud',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Villkor"
      title="Användarvillkor"
      intro="Dessa villkor gäller när du använder GuldBud för att sälja föremål som privatperson eller för att buda som auktoriserad handlare."
      updated="26 augusti 2026"
      sections={[
        {
          heading: 'Om GuldBud och tjänsten',
          body: [
            'Tjänsten tillhandahålls av GuldBud AB (org.nr 559291-4781), nedan kallat GuldBud. GuldBud är en marknadsplats där privatpersoner kan lägga ut guld, ädelmetaller och smycken för budgivning, och där verifierade handlare budar mot varandra.',
            'GuldBud förmedlar affären och hanterar den säkra avvecklingen: föremålet skickas till GuldBud som kontrollerar äktheten, betalar ut till säljaren och skickar vidare till den vinnande handlaren. Handlarna är anonyma gentemot varandra och gentemot säljaren.',
            'GuldBud är förmedlare och auktionsplattform. Köpeavtalet ingås mellan säljaren och den vinnande handlaren. GuldBud är inte köpare eller säljare av föremålet och är inte part i köpeavtalet mellan dem. GuldBud ansvarar för de tjänster vi själva tillhandahåller, det vill säga förmedling, äkthetskontroll, betalningsavveckling och frakt, enligt dessa villkor. Detta påverkar inte de rättigheter du som konsument har enligt tvingande lag.',
          ],
        },
        {
          heading: 'Definitioner',
          body: [
            '"Föremål" avser det som säljaren lägger ut och skickar in till GuldBud. "Säljare" avser den privatperson som lägger ut ett föremål. "Handlare" avser den granskade och godkända näringsidkare som lägger bud. "Affär" avser den uppgörelse som uppstår när säljaren accepterar ett vinnande bud.',
          ],
        },
        {
          heading: 'Konto, ålder och identitet',
          body: [
            'För att sälja måste du vara minst 18 år, ha svenskt personnummer och vara folkbokförd på fast adress i Sverige. Du måste vara den rättmätiga ägaren till föremålet och ha rätt att fritt överlåta det.',
            'GuldBud kan komma att verifiera din identitet, till exempel med BankID, innan en utbetalning genomförs. Handlare granskas och godkänns manuellt utifrån organisationsnummer och företagsuppgifter innan de får buda.',
            'Du ansvarar för att de uppgifter du lämnar är korrekta och för att hålla dina inloggningsuppgifter säkra.',
          ],
        },
        {
          heading: 'Att lägga ut ett föremål',
          body: [
            'Som säljare ansvarar du för att uppgifter om föremålet – såsom bilder, vikt, karat och eventuella ädelstenar – är korrekta efter bästa förmåga. GuldBud granskar varje föremål innan auktionen öppnas och kan avböja föremål utan att ange skäl.',
          ],
        },
        {
          heading: 'Budgivning och när avtal uppstår',
          body: [
            'Ett lagt bud är bindande. Den handlare som har det högsta budet när auktionen avslutas har vunnit budgivningen. Ett bindande avtal om köp uppstår först när säljaren accepterar det vinnande budet.',
            'Har säljaren angett ett reservationspris (minimipris) är säljaren inte skyldig att acceptera ett bud som understiger det.',
          ],
        },
        {
          heading: 'Frakt och ansvar under transport',
          body: [
            'Efter att säljaren accepterat det vinnande budet tillhandahåller GuldBud ett kostnadsfritt, rekommenderat brev med förbetalt porto, försäkrat upp till 100 000 kr. Säljaren lägger föremålet i det tillhandahållna brevet och postar det rekommenderat enligt de instruktioner som ges i tjänsten. Säljaren ansvarar för att föremålet är korrekt och säkert paketerat i brevet.',
            'GuldBud ansvarar för föremål under transport inom ramen för nämnda försäkring, det vill säga upp till 100 000 kr, förutsatt att säljaren har använt det tillhandahållna rekommenderade brevet och följt de fraktinstruktioner som anges i tjänsten. Vid skadad eller förlorad försändelse ska säljaren spara inlämningskvitto och kontakta GuldBud. Föremål som skickas på annat sätt än enligt instruktionerna sker på säljarens egen risk.',
          ],
        },
        {
          heading: 'Kontroll av föremål',
          body: [
            'GuldBud har rätt att kontrollera föremålets äkthet och sammansättning i syfte att bekräfta uppgifterna. Kontrollen kan innefatta kemiska och tekniska tester (probering). Vid behov kan föremål monteras isär för att separat kunna väga ädelmetallen eller undersöka ingående stenar.',
          ],
        },
        {
          heading: 'Pris och betalning',
          body: [
            'Det slutliga priset motsvarar det accepterade budet, men kan justeras om äkthetskontrollen visar att föremålet väsentligt avviker från de uppgifter som angavs. Priset påverkas av bland annat guldmängd samt ädelstenars vikt, klarhet, färg och slipning.',
            'När kontrollen är godkänd betalar GuldBud ut till säljaren inom 24 timmar via Swish eller bankkonto. Utbetalning sker till det konto som säljaren anger i inloggat läge. Säljaren ansvarar för att angivna konto- och clearinguppgifter är korrekta; GuldBud ansvarar inte för utbetalning till felaktigt angivet konto.',
            'GuldBud tar inte ut någon avgift av säljaren. Säljaren får hela det vinnande budbeloppet. GuldBud tar i stället ut en köparprovision av den vinnande handlaren. Provisionen är för närvarande 8 % av det vinnande budet och läggs ovanpå budet. Utöver provisionen tillkommer en fast fraktavgift på 199 kr (inklusive moms) för försäkrad leverans av föremålet till handlaren. På provisionen och frakten tillkommer moms med 25 %. Handlaren betalar alltså bud plus provision plus frakt plus moms, och ser sitt totalpris innan budet läggs.',
            'GuldBud är förmedlare och inte part i köpet av föremålet. Köpet sker mellan säljaren och den vinnande handlaren. Eftersom handlaren köper föremålet av en privatperson behöver handlaren enligt bokförings- och skatteregler kunna dokumentera vem föremålet köpts av. När din vara sålts lämnar GuldBud därför dina identitetsuppgifter (namn, personnummer och adress) till den köpande handlaren för dennes bokföring. Under pågående auktion förblir du anonym.',
          ],
        },
        {
          heading: 'Ångerrätt, retur och outlösta försändelser',
          body: [
            'Som privatperson kan du enligt distansavtalslagen dra tillbaka ett föremål fram till dess att en bindande affär genomförts. Vill du dra tillbaka ett föremål innan budgivningen avslutats, kontakta oss på info@guldbud.com.',
            'Accepterar säljaren inte det pris som slutligen erbjuds returneras föremålet kostnadsfritt. Löses en returnerad försändelse inte ut inom rimlig tid kontaktar vi säljaren innan vidare åtgärd.',
          ],
        },
        {
          heading: 'Personuppgifter och cookies',
          body: [
            'GuldBud behandlar personuppgifter i enlighet med dataskyddsförordningen (GDPR). Hur vi samlar in och behandlar uppgifter, samt hur vi använder cookies, beskrivs i vår integritetspolicy.',
          ],
        },
        {
          heading: 'Missbruk och rapportering',
          body: [
            'GuldBud polisanmäler misstänkt hantering av stöldgods, bedrägeri och annat missbruk samt försök därtill. GuldBud kan komma att lämna uppgifter till myndigheter i enlighet med gällande lag.',
          ],
        },
        {
          heading: 'Kontrollsamtal',
          body: [
            'GuldBud har rätt att kontakta säljaren för att verifiera identitet, bekräfta lämnade uppgifter eller stämma av villkoren för en affär innan utbetalning genomförs.',
          ],
        },
        {
          heading: 'Meddelanden',
          body: [
            'Meddelanden som GuldBud skickar via e-post, SMS eller aviseringar i tjänsten anses ha nått dig samma dag som de skickas till de kontaktuppgifter du angett. Du ansvarar för att hålla dina kontaktuppgifter uppdaterade.',
          ],
        },
        {
          heading: 'Ansvarsbegränsning',
          body: [
            'GuldBud ansvarar inte för skada som beror på felaktiga uppgifter från säljare eller handlare, eller för indirekta skador. GuldBud ansvarar inte heller för störningar i data- eller banksystem, eller för skada som beror på lag, myndighetsåtgärd, krig, strejk, naturhändelse eller annan omständighet utanför vår kontroll (force majeure).',
            'Ansvarsbegränsningarna påverkar inte de rättigheter du som konsument har enligt tvingande lag.',
          ],
        },
        {
          heading: 'Ändringar, tillämplig lag och tvist',
          body: [
            'GuldBud kan uppdatera dessa villkor. Väsentliga ändringar meddelas på webbplatsen. Svensk lag tillämpas. Tvist med anledning av dessa villkor ska i första hand lösas i samförstånd och prövas annars av svensk allmän domstol, med Stockholms tingsrätt som första instans om inte annat följer av tvingande lag.',
          ],
        },
      ]}
    />
  )
}
