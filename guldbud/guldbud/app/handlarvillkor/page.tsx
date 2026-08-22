import LegalPage from '@/components/LegalPage'

export const metadata = {
  title: 'Handlarvillkor · GuldBud',
  description:
    'Villkor för auktoriserade handlare på GuldBud: budgivning, betalning, avgifter, processen efter vunnet bud, liggtid och regelefterlevnad, samt avstängning vid misskötsamhet.',
  alternates: { canonical: '/handlarvillkor' },
}

export default function DealerTermsPage() {
  return (
    <LegalPage
      eyebrow="Villkor"
      title="Handlarvillkor"
      intro="Dessa villkor gäller för dig som är godkänd handlare på GuldBud och budar på föremål. De gäller utöver GuldBuds allmänna användarvillkor. Genom att registrera dig som handlare godkänner du villkoren."
      updated="22 augusti 2026"
      sections={[
        {
          heading: 'Vem som får vara handlare',
          body: [
            'För att bli handlare på GuldBud ska du vara en registrerad näringsidkare med giltigt organisationsnummer och ha rätt att bedriva handel med guld, ädelmetaller och begagnade smycken. Du ansvarar för att inneha och vidmakthålla de registreringar och tillstånd som din verksamhet kräver, till exempel registrering för handel med begagnade varor hos Polismyndigheten där så krävs, samt eventuell registrering som verksamhetsutövare enligt penningtvättsregelverket.',
            'Handlarkonton granskas och godkänns manuellt utifrån organisationsnummer och företagsuppgifter. GuldBud kan avböja en ansökan eller återkalla ett godkännande utan att ange skäl. Du ansvarar för att de uppgifter du lämnar är korrekta och hålls uppdaterade.',
          ],
        },
        {
          heading: 'Bindande bud och köpskyldighet',
          body: [
            'Varje bud du lägger är bindande och kan inte återkallas. Den handlare som har det högsta budet när auktionen avslutas har vunnit budgivningen. Ett bindande köpavtal uppstår när säljaren accepterar det vinnande budet.',
            'När budgivningen är vunnen och budet accepterat är du skyldig att fullfölja köpet och betala omgående enligt nedan. Att vinna en auktion och sedan inte betala är ett väsentligt avtalsbrott.',
          ],
        },
        {
          heading: 'Betalning omgående efter vunnet bud',
          body: [
            'Efter att du vunnit en auktion ska betalning ske omgående, senast inom en (1) bankdag, via den betalningsmetod som anvisas i tjänsten. Betalningen omfattar det vinnande budet plus slagavgift och plus fraktavgift enligt nedan.',
            'Föremålet skickas vidare till dig först när din betalning har registrerats. Ingen vara lämnar GuldBud på kredit. Betalar du inte i tid skickar vi en påminnelse och kan därefter häva affären.',
          ],
        },
        {
          heading: 'Avgifter: slagavgift och frakt',
          body: [
            'På varje vunnen affär tillkommer en slagavgift (köparprovision) på 8 % av det vinnande budet, som läggs ovanpå budet. Utöver detta tillkommer en fast fraktavgift på 149 kr per föremål för försäkrad leverans till dig. Avgifterna gäller samtliga varor.',
            'Du ser alltid ditt totalpris inklusive slagavgift och frakt innan du lägger ett bud. Inköpet sker från en privatperson och är därför utan moms. Du ansvarar själv för din moms- och skattehantering vid vidareförsäljning, där vinstmarginalbeskattning (VMB) normalt tillämpas för begagnade varor.',
          ],
        },
        {
          heading: 'Så går processen till efter vunnet bud',
          body: [
            'När du vunnit budgivningen och säljaren accepterat: (1) du betalar bud, slagavgift och frakt omgående; (2) säljaren skickar in föremålet till GuldBud i ett försäkrat, rekommenderat brev; (3) GuldBud tar emot och äkthetskontrollerar föremålet; (4) GuldBud betalar ut till säljaren; (5) GuldBud packar och skickar föremålet försäkrat vidare till dig; (6) du bekräftar mottagandet i affären.',
            'Du kan följa varje steg och kommunicera med GuldBud i affärsvyn. Handlare är anonyma gentemot varandra och gentemot säljaren.',
          ],
        },
        {
          heading: 'Äkthet, avvikelser och reklamation',
          body: [
            'GuldBud kontrollerar föremålets äkthet och sammansättning innan det skickas vidare. Visar kontrollen att föremålet väsentligt avviker från de uppgifter som angavs, eller att det inte är äkta, återgår affären och du krediteras.',
            'Har du efter mottagandet en invändning mot föremålet ska du kontakta GuldBud utan oskäligt dröjsmål via affärsvyn, så hanterar vi ärendet.',
          ],
        },
        {
          heading: 'Liggtid och regelefterlevnad',
          body: [
            'Du åtar dig att följa de krav som gäller för handel med begagnade varor och ädelmetaller, inklusive föreskriven liggtid innan ett inköpt föremål smälts ned, ändras eller säljs vidare (i förekommande fall 30 dagar), samt krav på förteckning, dokumentation och uppgiftslämnande till myndighet. Syftet är bland annat att stöldgods ska kunna spåras.',
            'Du åtar dig vidare att medverka i GuldBuds kontroller mot penningtvätt och att lämna de uppgifter om din verksamhet som efterfrågas.',
          ],
        },
        {
          heading: 'Självständig budgivning',
          body: [
            'På GuldBud budar varje handlare självständigt. Du får inte komma överens med andra handlare om att hålla nere priserna eller att dela upp föremål mellan er. Lägg bara bud som du menar allvar med och är beredd att fullfölja.',
            'GuldBud följer budgivningen och kan stänga av en handlare som samordnar bud med andra eller på annat sätt sätter den fria budgivningen ur spel.',
          ],
        },
        {
          heading: 'Misskötsamhet och avstängning',
          body: [
            'GuldBud kan varna, tillfälligt stänga av eller permanent utesluta en handlare vid brott mot dessa villkor. Det gäller bland annat utebliven eller sen betalning av en vunnen auktion, samordnad budgivning med andra handlare, upprepade reklamationer utan grund, oprofessionellt uppträdande, eller misstanke om bedrägeri eller hantering av stöldgods.',
            'Uteblir betalning för en vunnen auktion trots påminnelse kan affären hävas och handlaren stängas av. Handlaren kan hållas ansvarig för de kostnader och den skada som misskötsamheten orsakar GuldBud eller säljaren. Allvarliga eller upprepade överträdelser leder till permanent avstängning.',
          ],
        },
        {
          heading: 'Sekretess och personuppgifter',
          body: [
            'Uppgifter om säljare och föremål som du får tillgång till i en affär får endast användas för att genomföra just den affären. Du får inte kontakta säljaren utanför tjänsten, spara eller sprida uppgifterna för andra ändamål, och du ska behandla uppgifterna i enlighet med dataskyddsförordningen (GDPR).',
          ],
        },
        {
          heading: 'Ansvar och risk',
          body: [
            'GuldBud ansvarar för föremålet under transporten till dig inom ramen för fraktförsäkringen (upp till 100 000 kr). Risken för föremålet går över på dig när du mottagit det. GuldBud ansvarar inte för indirekta skador eller för skada som beror på omständigheter utanför vår kontroll (force majeure).',
          ],
        },
        {
          heading: 'Ändringar, tillämplig lag och tvist',
          body: [
            'GuldBud kan uppdatera dessa handlarvillkor. Väsentliga ändringar meddelas i tjänsten, och fortsatt användning innebär att du godkänner de uppdaterade villkoren. Svensk lag tillämpas. Tvist ska i första hand lösas i samförstånd och prövas annars av svensk allmän domstol, med Stockholms tingsrätt som första instans.',
          ],
        },
      ]}
    />
  )
}
