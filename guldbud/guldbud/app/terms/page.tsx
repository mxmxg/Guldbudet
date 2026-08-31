import LegalPage from '@/components/LegalPage'
import { TERMS_UPDATED_LABEL } from '@/lib/terms'

export const metadata = {
  title: 'Användarvillkor',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Villkor"
      title="Användarvillkor"
      intro="Dessa villkor gäller när du som privatperson använder GuldBud för att sälja ett föremål. Genom att registrera dig godkänner du villkoren."
      updated={TERMS_UPDATED_LABEL}
      sections={[
        {
          heading: 'Om GuldBud och tjänsten',
          body: [
            'Tjänsten tillhandahålls av GuldBud AB, org.nr 559291-4781, nedan kallat GuldBud. GuldBud driver en digital marknadsplats där privatpersoner kan lägga ut guld, ädelmetaller och smycken för budgivning och där verifierade handlare kan lämna bud.',
            'När du som privatperson använder GuldBud för att sälja ett föremål ger du GuldBud i uppdrag att förmedla försäljningen i ditt namn och för din räkning till en godkänd handlare. GuldBud är därmed förmedlare och plattform och är inte köpare eller säljare av föremålet.',
            'Det köp som uppstår genom tjänsten ingås mellan dig som säljare och den vinnande handlaren. GuldBud är inte part i köpeavtalet mellan säljaren och handlaren.',
            'GuldBud tillhandahåller egna tjänster i form av förmedling, kontroll av föremål, administrering av betalningsavveckling och transport enligt dessa villkor.',
            'GuldBud hanterar betalning av köpeskillingen till säljaren för säljarens räkning. Den del av betalningen som avser säljarens köpeskilling tillhör säljaren och är inte GuldBuds ersättning.',
            'Inom ramen för förmedlingsuppdraget åtar sig GuldBud att:',
          ],
          bullets: [
            'tillvarata ditt intresse och utföra uppdraget med omsorg,',
            'hålla dig underrättad om bud, accept, mottagande, kontroll och utbetalning,',
            'hålla dina medel åtskilda från GuldBuds egna medel fram till utbetalning,',
            'redovisa affären för dig genom det underlag som tillhandahålls i tjänsten,',
            'betala ut din köpeskilling utan avdrag enligt dessa villkor,',
            'förvara föremålet aktsamt så länge det är i GuldBuds besittning,',
            'samt kostnadsfritt återlämna föremålet till dig om någon affär inte kommer till stånd.',
          ],
        },
        {
          heading: 'Definitioner',
          body: [
            '"Föremål" avser det som säljaren lägger ut i tjänsten och skickar till GuldBud. "Säljare" avser den privatperson som lägger ut ett föremål och lämnar GuldBud uppdrag att förmedla försäljningen. "Handlare" avser den granskade och godkända näringsidkare som lämnar bud i tjänsten. "Affär" avser köpeavtalet mellan säljaren och den vinnande handlaren.',
            '"Förmedlingsuppdraget" avser det uppdrag du lämnar GuldBud att förmedla försäljningen av föremålet i ditt namn och för din räkning. Uppdraget lämnas när du publicerar ett föremål i tjänsten.',
          ],
        },
        {
          heading: 'Konto, ålder och identitet',
          body: [
            'För att sälja måste du vara minst 18 år, ha svenskt personnummer och vara folkbokförd på fast adress i Sverige. Du måste vara rättmätig ägare till föremålet och ha rätt att fritt överlåta det.',
            'Du legitimerar dig med BankID innan du kan lägga ut ditt första föremål. GuldBud kan därutöver komma att verifiera din identitet på nytt före en utbetalning.',
            'Handlare granskas och godkänns manuellt utifrån organisationsnummer och företagsuppgifter innan de får lämna bud.',
            'Du ansvarar för att de uppgifter du lämnar är korrekta och för att skydda dina inloggningsuppgifter.',
          ],
        },
        {
          heading: 'Att lägga ut ett föremål',
          body: [
            'Du ansvarar för att uppgifter om föremålet, såsom bilder, vikt, karat och eventuella ädelstenar, är korrekta efter bästa förmåga.',
            'GuldBud granskar varje föremål innan auktionen öppnas och kan avstå från att publicera eller vidareförmedla ett föremål som inte uppfyller tjänstens krav.',
            'GuldBud kan också avbryta ett förmedlingsuppdrag efter att auktionen öppnat, om det uppkommer tveksamhet om föremålets äkthet, om din äganderätt till föremålet eller om din rätt att sälja det. Föremålet returneras då kostnadsfritt till dig, om inte annat följer av punkt 12.',
            'Genom att lägga ut ett föremål ger du GuldBud rätt att använda de bilder och uppgifter du lämnat för att presentera föremålet i tjänsten samt i marknadsföring av tjänsten, inklusive i digitala och sociala medier. Rätten gäller även efter att föremålet sålts. Du behåller upphovsrätten till dina egna bilder.',
            'Att GuldBud tar emot föremålet för kontroll innebär inte att GuldBud blir ägare till föremålet eller part i det köp som förmedlas.',
          ],
        },
        {
          heading: 'Budgivning och när köpeavtal uppstår',
          body: [
            'Ett lagt bud från en handlare är bindande enligt de regler som gäller för budgivningen. När auktionen avslutas utses vinnande bud enligt tjänstens regler.',
            'Ett köp av föremålet uppstår mellan säljaren och den vinnande handlaren först när säljaren accepterar det vinnande budet. GuldBud är inte part i detta köp utan förmedlar affären på säljarens uppdrag.',
            'Har säljaren angett ett reservationspris är säljaren inte skyldig att acceptera ett bud som understiger reservationspriset.',
          ],
        },
        {
          heading: 'Frakt och ansvar under transport',
          body: [
            'Efter att säljaren accepterat det vinnande budet tillhandahåller GuldBud ett kostnadsfritt, rekommenderat brev med förbetalt porto, försäkrat upp till 100 000 kr.',
            'Säljaren ska använda det tillhandahållna brevet och följa de fraktinstruktioner som lämnas i tjänsten. Säljaren ansvarar för att föremålet är korrekt och säkert paketerat.',
            'GuldBud ansvarar för hanteringen av försändelsen inom ramen för den försäkring som anges ovan, under förutsättning att säljaren följt instruktionerna. Vid skadad eller förlorad försändelse ska säljaren spara inlämningskvittot och kontakta GuldBud.',
            'Föremål som skickas på annat sätt än enligt instruktionerna sker på säljarens egen risk.',
          ],
        },
        {
          heading: 'Kontroll av föremål',
          body: [
            'GuldBud kontrollerar föremålets äkthet och sammansättning i syfte att verifiera uppgifter som ligger till grund för förmedlingen. Kontrollen kan innefatta kemiska och tekniska tester, såsom probering. Vid behov kan ett föremål monteras isär för att separat väga ädelmetall eller undersöka ingående stenar.',
            'Kontrollen innebär inte att GuldBud köper eller förvärvar föremålet.',
            'Om kontrollen visar att föremålet väsentligt avviker från de uppgifter som låg till grund för det accepterade budet kan den förmedlade affären inte fullföljas enligt de villkor som accepterats. GuldBud underrättar då både säljaren och handlaren om vad kontrollen visat.',
            'Handlaren kan därefter lämna ett nytt bud utifrån föremålets faktiska egenskaper, och säljaren kan acceptera eller avböja det. GuldBud fastställer inte priset, utan förmedlar parternas nya överenskommelse på samma sätt som den ursprungliga. Säljaren är aldrig skyldig att acceptera ett nytt bud.',
            'Kommer ingen ny överenskommelse till stånd genomförs ingen utbetalning till säljaren, handlarens betalning krediteras, och föremålet returneras kostnadsfritt till säljaren.',
            'GuldBud har inte rätt att själv köpa föremålet i stället för den ursprungliga handlaren inom ramen för denna tjänst.',
          ],
        },
        {
          heading: 'Pris, betalning och GuldBuds ersättning',
          body: [
            'Köpeskillingen för föremålet är det belopp som säljaren och den vinnande handlaren kommit överens om genom det accepterade budet, med de kontrollregler som anges i dessa villkor.',
            'GuldBud tar inte ut någon provision eller annan avgift från säljaren. Säljaren har rätt till hela den köpeskilling som tillkommer säljaren enligt köpeavtalet mellan säljaren och handlaren.',
            'GuldBud får sin ersättning från handlaren för de tjänster GuldBud tillhandahåller. Provisionen är för närvarande 8 procent av det vinnande budet. Därutöver tillkommer en fast avgift om 199 kr inklusive moms för transport av föremålet till handlaren. På GuldBuds egna ersättningar tas moms ut enligt gällande regler. Handlaren får se det totala belopp som ska betalas innan bud lämnas.',
            'När föremålet har godkänts genom kontroll administrerar GuldBud utbetalningen av säljarens köpeskilling inom 24 timmar via Swish eller bankkonto. Utbetalning sker till det konto som säljaren anger i inloggat läge. Säljaren ansvarar för att angivna konto- och clearinguppgifter är korrekta.',
            'Utbetalningen görs för säljarens räkning. GuldBud gör inget avdrag från säljarens köpeskilling och har inte rätt till säljarens köpeskilling utöver den ersättning som uttryckligen avser GuldBuds egna tjänster.',
            'Säljaren ansvarar för eventuella skatter som försäljningen kan medföra för säljaren, till exempel om försäljningen får sådan omfattning att den bedöms som näringsverksamhet. GuldBud gör ingen skattemässig bedömning av säljarens situation och lämnar inte skatterådgivning.',
          ],
        },
        {
          heading: 'Identifiering av säljaren',
          body: [
            'Under pågående auktion är säljaren anonym för handlarna.',
            'När ett köp har kommit till stånd får den köpande handlaren de uppgifter om säljaren som krävs för att dokumentera handlarens köp och uppfylla tillämpliga bokförings-, skatte- och andra rättsliga krav. Det kan exempelvis omfatta säljarens namn, personnummer och adress.',
          ],
        },
        {
          heading: 'Återkallelse, retur och outlösta försändelser',
          body: [
            'Säljaren kan återkalla ett föremål från försäljning fram till dess att en bindande affär enligt punkt 5 har uppstått, under förutsättning att tjänsten inte anger annat för den aktuella auktionen. Vill du dra tillbaka ett föremål innan budgivningen avslutats, kontakta oss på info@guldbud.com.',
            'Återkallelse efter att ett bindande köp har uppstått kan inte ske ensidigt, om inte annat följer av lag eller av dessa villkor.',
            'Om en auktion avslutas utan att säljaren accepterar något bud returneras föremålet till säljaren enligt de rutiner som anges i tjänsten. Löses en returnerad försändelse inte ut inom rimlig tid kontaktar GuldBud säljaren innan vidare åtgärd vidtas.',
            'Föremål återlämnas endast till säljaren själv, till den folkbokföringsadress säljaren registrerat i tjänsten. Ska föremålet gå till någon annan krävs att GuldBud på förhand kan verifiera behörigheten.',
          ],
        },
        {
          heading: 'Personuppgifter och cookies',
          body: [
            'GuldBud behandlar personuppgifter i enlighet med dataskyddsförordningen (GDPR). Information om hur GuldBud samlar in, använder och lagrar personuppgifter samt information om cookies finns i GuldBuds integritetspolicy.',
          ],
        },
        {
          heading: 'Missbruk och rapportering',
          body: [
            'GuldBud kan komma att polisanmäla misstänkt hantering av stöldgods, bedrägeri och annat missbruk samt försök därtill.',
            'Visar det sig att ett inlämnat föremål är stöldgods överlämnas föremålet till Polismyndigheten och förmedlingsuppdraget upphör. Föremålet återlämnas då inte till säljaren, som själv får styrka sin äganderätt gentemot Polismyndigheten.',
            'GuldBud kan lämna information till myndigheter när detta följer av lag eller annars är tillåtet eller nödvändigt för att uppfylla rättsliga skyldigheter.',
          ],
        },
        {
          heading: 'Kontrollsamtal',
          body: [
            'GuldBud har rätt att kontakta säljaren för att verifiera identitet, bekräfta lämnade uppgifter eller kontrollera omständigheter kring ett föremål eller en affär innan utbetalning genomförs.',
          ],
        },
        {
          heading: 'Meddelanden',
          body: [
            'Meddelanden som GuldBud skickar via e-post, SMS eller aviseringar i tjänsten anses skickade till de kontaktuppgifter som säljaren har registrerat. Säljaren ansvarar för att kontaktuppgifterna hålls aktuella.',
          ],
        },
        {
          heading: 'Ansvarsbegränsning',
          body: [
            'GuldBud ansvarar inte för skada som beror på felaktiga eller ofullständiga uppgifter som lämnats av säljare eller handlare. GuldBud ansvarar inte för indirekta skador i den utsträckning sådan begränsning är tillåten enligt lag.',
            'GuldBud ansvarar inte heller för störningar i data-, kommunikations- eller banksystem eller för omständigheter utanför GuldBuds rimliga kontroll, såsom myndighetsåtgärd, krig, strejk eller naturhändelse.',
            'Ansvarsbegränsningarna gäller inte i den utsträckning de strider mot tvingande lag.',
          ],
        },
        {
          heading: 'Ändringar, tillämplig lag och tvist',
          body: [
            'GuldBud kan uppdatera dessa villkor. Väsentliga ändringar ska kommuniceras på lämpligt sätt.',
            'Svensk lag tillämpas. Tvist med anledning av avtalet ska i första hand försöka lösas i samförstånd. Kan tvisten inte lösas i samförstånd får den prövas av svensk allmän domstol.',
            'Tvingande konsumenträttsliga regler gäller alltid i den utsträckning de är tillämpliga.',
          ],
        },
      ]}
    />
  )
}
