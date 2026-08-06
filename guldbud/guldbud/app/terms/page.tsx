import LegalPage from '@/components/LegalPage'

export const metadata = { title: 'Användarvillkor · GuldBud' }

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Villkor"
      title="Användarvillkor"
      intro="Dessa villkor gäller när du använder GuldBud för att sälja föremål eller för att buda som auktoriserad handlare."
      updated="6 augusti 2026"
      sections={[
        {
          heading: 'Om tjänsten',
          body: [
            'GuldBud är en marknadsplats där privatpersoner kan lägga ut guld och andra ädelmetaller för budgivning, och där verifierade handlare budar mot varandra. GuldBud är förmedlare och inte part i det köpeavtal som uppstår mellan säljare och handlare.',
          ],
        },
        {
          heading: 'Konto och verifiering',
          body: [
            'För att lägga ut ett föremål eller buda behöver du ett konto med korrekta uppgifter. Handlare granskas och godkänns manuellt innan de får buda.',
            'Du ansvarar för att uppgifterna du lämnar är riktiga och för att hålla dina inloggningsuppgifter säkra.',
          ],
        },
        {
          heading: 'Att lägga ut ett föremål',
          body: [
            'Som säljare ansvarar du för att du äger föremålet och har rätt att sälja det, samt för att bilder och uppgifter om vikt och karat är korrekta efter bästa förmåga.',
            'Vi granskar varje föremål innan auktionen öppnas och kan avböja föremål som inte uppfyller våra krav.',
          ],
        },
        {
          heading: 'Budgivning',
          body: [
            'Ett lagt bud är bindande. Den handlare som har det högsta budet när auktionen avslutas har vunnit budgivningen, förutsatt att säljaren accepterar budet.',
            'Det slutliga priset kan justeras om äkthetskontrollen visar att föremålet avviker väsentligt från de uppgifter som angavs.',
          ],
        },
        {
          heading: 'Frakt, kontroll och betalning',
          body: [
            'Efter avslutad auktion skickar säljaren föremålet försäkrat till GuldBud, som kontrollerar äktheten. När kontrollen är godkänd betalas beloppet ut till säljaren och föremålet skickas vidare till den vinnande handlaren.',
            'GuldBud tar inte ut någon avgift av säljaren för att lägga ut eller sälja ett föremål.',
          ],
        },
        {
          heading: 'Ångerrätt',
          body: [
            'Som privatperson kan du ha ångerrätt enligt distansavtalslagen fram till dess att en bindande affär genomförts. Kontakta oss på info@guldbud.com om du vill dra tillbaka ett föremål innan budgivningen avslutats.',
          ],
        },
        {
          heading: 'Ansvarsbegränsning',
          body: [
            'GuldBud ansvarar inte för skada som beror på felaktiga uppgifter från säljare eller handlare, eller för indirekta skador. Vårt ansvar är i alla händelser begränsat till vad som följer av tvingande lag.',
          ],
        },
        {
          heading: 'Ändringar och tillämplig lag',
          body: [
            'Vi kan uppdatera dessa villkor. Väsentliga ändringar meddelas på webbplatsen. Svensk lag tillämpas och tvister prövas av svensk allmän domstol.',
          ],
        },
      ]}
    />
  )
}
