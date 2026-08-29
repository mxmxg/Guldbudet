import LegalPage from '@/components/LegalPage'
import { TERMS_UPDATED_LABEL } from '@/lib/terms'

export const metadata = {
  title: 'Handlarvillkor · GuldBud',
  description:
    'Villkor för auktoriserade handlare på GuldBud: budgivning, betalning, avgifter, processen efter vunnet bud, regelefterlevnad, samt avstängning vid misskötsamhet.',
  alternates: { canonical: '/handlarvillkor' },
}

export default function DealerTermsPage() {
  return (
    <LegalPage
      eyebrow="Villkor"
      title="Handlarvillkor"
      intro="Dessa villkor gäller för dig som är godkänd handlare på GuldBud och budar på föremål. De gäller utöver GuldBuds allmänna användarvillkor. Genom att registrera dig som handlare godkänner du villkoren."
      updated={TERMS_UPDATED_LABEL}
      sections={[
        {
          heading: 'Vem som får vara handlare',
          body: [
            'Tjänsten tillhandahålls av GuldBud AB, org.nr 559291-4781, nedan kallat GuldBud.',
            'För att bli handlare på GuldBud ska du vara en registrerad näringsidkare med giltigt organisationsnummer och ha rätt att bedriva den handel som din verksamhet omfattar.',
            'Du ansvarar själv för att inneha och vidmakthålla de registreringar, tillstånd och övriga krav som gäller för din verksamhet, inklusive registrering för handel med begagnade varor hos Polismyndigheten där sådan registrering krävs, samt eventuella skyldigheter enligt penningtvättsregelverket.',
            'Handlarkonton granskas och godkänns manuellt utifrån organisationsnummer och företagsuppgifter. GuldBud kan avslå en ansökan eller återkalla ett godkännande när detta är motiverat av tjänstens säkerhet, regelefterlevnad eller riskhantering.',
            'Du ansvarar för att de uppgifter du lämnar till GuldBud är korrekta och aktuella.',
          ],
        },
        {
          heading: 'Budgivning och köpeavtal',
          body: [
            'Varje bud du lämnar är bindande enligt reglerna för den aktuella auktionen och kan inte återkallas.',
            'Den handlare som har det högsta budet när auktionen avslutas utses till vinnande handlare. Ett bindande köpavtal om föremålet uppstår först när säljaren accepterar det vinnande budet.',
            'Köpeavtalet ingås mellan dig som handlare och säljaren. GuldBud är förmedlare och plattform, är inte köpare eller säljare av föremålet och är inte part i köpeavtalet mellan dig och säljaren.',
            'GuldBud tillhandahåller egna tjänster i form av förmedling, kontroll av föremål, administrering av betalningsavveckling och transport.',
            'När ett köp har uppstått är du skyldig att fullfölja köpet enligt dessa villkor. Att vinna en auktion och därefter utan godtagbart skäl inte betala utgör ett avtalsbrott.',
          ],
        },
        {
          heading: 'Betalning efter vunnet bud',
          body: [
            'När säljaren har accepterat det vinnande budet ska du betala det totala belopp som anges i affärsvyn senast inom ett (1) dygn.',
            'Betalningen består av den köpeskilling som enligt köpeavtalet tillkommer säljaren, GuldBuds köparprovision, samt eventuell fraktavgift och moms på GuldBuds egna tjänster enligt aktuell prisuppgift.',
            'Säljarens köpeskilling och GuldBuds ersättning är ekonomiskt separata delar av betalningen. GuldBud administrerar betalningen och verkställer utbetalningen av säljarens köpeskilling för säljarens räkning.',
            'Föremålet skickas vidare till handlaren först när full betalning har registrerats. GuldBud säljer inte föremålet på kredit.',
            'Vid utebliven betalning skickas en påminnelse. Om betalning därefter inte sker har GuldBud rätt att häva den förmedlade affären enligt dessa villkor och vidta de åtgärder som anges i punkt 9.',
          ],
        },
        {
          heading: 'Köparprovision och frakt',
          body: [
            'På varje vunnen affär tillkommer en köparprovision om 8 procent av det vinnande budet. Utöver provisionen tillkommer en fast fraktavgift om 199 kr inklusive moms per föremål för försäkrad leverans till handlaren.',
            'GuldBuds provision och fraktavgift är ersättning för tjänster som GuldBud tillhandahåller, och moms hanteras enligt gällande regler. Handlaren ska innan budet lämnas kunna se det totala belopp som blir att betala vid ett vunnet bud.',
            'Själva föremålet köps av handlaren direkt från säljaren. GuldBud ansvarar inte för handlarens egen moms- eller skattehantering av inköpet eller en eventuell senare vidareförsäljning.',
          ],
        },
        {
          heading: 'Processen efter vunnet bud',
          body: [
            'När budgivningen är avslutad och säljaren accepterat det vinnande budet betalar handlaren den totala summan som anges i affärsvyn. Säljaren skickar därefter föremålet till GuldBud enligt de fraktinstruktioner som anges i tjänsten.',
            'GuldBud tar emot föremålet och genomför kontroll enligt punkt 6. Om kontrollen godkänns administrerar GuldBud utbetalningen av säljarens köpeskilling och skickar därefter föremålet vidare till handlaren, som bekräftar mottagandet i tjänsten.',
            'GuldBud agerar som förmedlare och administrerar processen mellan säljaren och handlaren. Handlare är anonyma gentemot andra handlare och gentemot säljaren under budgivningen.',
          ],
        },
        {
          heading: 'Kontroll av föremålet och avvikelser',
          body: [
            'GuldBud kontrollerar föremålets äkthet och sammansättning innan det skickas vidare till handlaren. Kontrollen kan innefatta kemiska och tekniska tester, inklusive probering, samt kontroll av vikt, karathalt och andra egenskaper som har betydelse för affären. Vid behov kan ett föremål monteras isär för att separat väga ädelmetall eller undersöka ingående stenar.',
            'Om kontrollen visar att föremålet inte motsvarar de uppgifter som låg till grund för det accepterade budet, eller om föremålet bedöms vara oäkta, kan den förmedlade affären inte fullföljas enligt de accepterade villkoren. GuldBud underrättar då både handlaren och säljaren om vad kontrollen visat.',
            'Handlaren kan därefter lämna ett nytt bud utifrån föremålets faktiska egenskaper, och säljaren kan acceptera eller avböja det. GuldBud fastställer inte priset, utan förmedlar parternas nya överenskommelse på samma sätt som den ursprungliga. Ingen av parterna är skyldig att träffa en ny överenskommelse.',
            'Kommer ingen ny överenskommelse till stånd återbetalas eller krediteras handlarens betalning enligt GuldBuds rutiner, och någon utbetalning av köpeskillingen till säljaren genomförs inte.',
            'GuldBud blir genom kontrollen inte ägare till föremålet och blir inte part i köpeavtalet mellan säljaren och handlaren.',
          ],
        },
        {
          heading: 'Handel med begagnade varor och regelefterlevnad',
          body: [
            'Du ansvarar för att följa de regler som gäller för din verksamhet och för handel med begagnade varor, ädelmetaller och smycken. Det kan exempelvis innebära krav på registrering, dokumentation, förteckning, liggtider och uppgifter till myndigheter.',
            'Du ska på begäran lämna den information som GuldBud behöver för att uppfylla sina rättsliga skyldigheter och för att kontrollera att du får använda tjänsten. Du ska även medverka i GuldBuds kontroller avseende penningtvätt och annan regelefterlevnad.',
          ],
        },
        {
          heading: 'Självständig budgivning',
          body: [
            'Varje handlare ska lämna bud självständigt.',
            'Du får inte samordna budgivningen med andra handlare, komma överens om att hålla nere priser, dela upp föremål mellan handlare eller på annat sätt begränsa den fria konkurrensen i budgivningen.',
            'GuldBud kan övervaka budgivningen och vidta åtgärder mot handlare som misstänks manipulera eller samordna budgivningen.',
          ],
        },
        {
          heading: 'Misskötsamhet, hävning och avstängning',
          body: [
            'GuldBud kan varna, tillfälligt stänga av eller permanent utesluta en handlare som bryter mot villkoren. Det kan bland annat ske vid:',
          ],
          bullets: [
            'utebliven eller väsentligt försenad betalning,',
            'återkommande brutna köp,',
            'manipulation eller samordning av bud,',
            'försök att kringgå GuldBuds regler,',
            'missbruk av säljaruppgifter,',
            'misstanke om bedrägeri, stöldgods eller annan olaglig verksamhet,',
            'eller andra allvarliga eller upprepade överträdelser.',
          ],
        },
        {
          heading: 'Sekretess och personuppgifter',
          body: [
            'Om betalning inte sker efter påminnelse får GuldBud häva den förmedlade affären. Handlaren kan bli ansvarig för kostnader och skada som uppkommer till följd av ett avtalsbrott i den utsträckning sådan ersättning följer av lag eller avtal.',
            'Uppgifter om säljare, föremål och affärer som du får tillgång till genom GuldBud får endast användas för att genomföra den aktuella affären och uppfylla rättsliga skyldigheter.',
            'Du får inte kontakta säljaren utanför tjänsten eller använda säljarens uppgifter för marknadsföring, egna affärer eller andra ändamål utan rättsligt stöd och, där det krävs, samtycke.',
            'Du ansvarar för att personuppgifter behandlas i enlighet med tillämplig dataskyddslagstiftning.',
          ],
        },
        {
          heading: 'Ansvar och risk',
          body: [
            'GuldBud ansvarar för föremålet under transport till handlaren inom ramen för den fraktförsäkring som anges för aktuell försändelse och under förutsättning att föremålet hanterats enligt GuldBuds instruktioner.',
            'Risken för föremålet övergår till handlaren när denne har mottagit föremålet.',
            'GuldBud ansvarar inte för indirekta skador i den utsträckning sådan ansvarsbegränsning är tillåten enligt lag. GuldBud ansvarar inte heller för störningar i kommunikations-, data-, betalnings- eller banksystem eller för andra omständigheter utanför GuldBuds rimliga kontroll.',
          ],
        },
        {
          heading: 'Ändringar, tillämplig lag och tvist',
          body: [
            'GuldBud kan uppdatera dessa handlarvillkor. Väsentliga ändringar meddelas på lämpligt sätt i tjänsten.',
            'Svensk lag tillämpas. Tvist med anledning av dessa villkor ska i första hand försöka lösas genom dialog. Om tvisten inte kan lösas i samförstånd får den prövas av svensk allmän domstol.',
          ],
        },
      ]}
    />
  )
}
