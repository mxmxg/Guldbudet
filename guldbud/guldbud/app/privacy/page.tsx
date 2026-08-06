import LegalPage from '@/components/LegalPage'

export const metadata = { title: 'Integritetspolicy · GuldBud' }

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Din integritet"
      title="Integritetspolicy"
      intro="Vi värnar om din personliga integritet. Här beskriver vi vilka uppgifter vi samlar in, varför, och vilka rättigheter du har."
      updated="6 augusti 2026"
      sections={[
        {
          heading: 'Personuppgiftsansvarig',
          body: [
            'GuldBud AB är personuppgiftsansvarig för behandlingen av dina personuppgifter på denna webbplats. Du når oss på info@guldbud.se.',
          ],
        },
        {
          heading: 'Vilka uppgifter vi samlar in',
          body: [
            'När du skapar ett konto eller lägger ut ett föremål samlar vi in namn, e-postadress, telefonnummer, adress och de uppgifter du anger om föremålet. För handlare samlar vi även in organisationsnummer och företagsuppgifter.',
            'Vi samlar in tekniska uppgifter som IP-adress och webbläsartyp när du besöker sidan, samt de bud och den aktivitet som sker på ditt konto.',
          ],
        },
        {
          heading: 'Varför vi behandlar uppgifterna',
          body: [
            'Vi behandlar uppgifterna för att kunna tillhandahålla tjänsten: verifiera användare, genomföra auktioner, förmedla kontakt mellan säljare och handlare samt hantera utbetalningar.',
            'Den lagliga grunden är fullgörande av avtal, samt i vissa fall vårt berättigade intresse av att driva en säker marknadsplats och att uppfylla rättsliga förpliktelser.',
          ],
        },
        {
          heading: 'Hur länge vi sparar uppgifterna',
          body: [
            'Vi sparar dina uppgifter så länge du har ett aktivt konto och därefter så länge det krävs för att uppfylla rättsliga skyldigheter, till exempel bokföringslagen.',
          ],
        },
        {
          heading: 'Vem vi delar uppgifter med',
          body: [
            'Vi delar endast de uppgifter som är nödvändiga för att genomföra en affär, till exempel kontaktuppgifter mellan säljare och den handlare som vinner budgivningen. Vi säljer aldrig dina uppgifter till tredje part.',
            'Vi anlitar underleverantörer för drift, betalning och frakt som behandlar uppgifter för vår räkning enligt personuppgiftsbiträdesavtal.',
          ],
        },
        {
          heading: 'Dina rättigheter',
          body: [
            'Du har rätt att begära ett utdrag av de uppgifter vi har om dig, att få felaktiga uppgifter rättade, och att i vissa fall få dina uppgifter raderade eller behandlingen begränsad.',
            'Du har även rätt att invända mot behandling och att klaga hos Integritetsskyddsmyndigheten (IMY). Kontakta oss på info@guldbud.se för att utöva dina rättigheter.',
          ],
        },
        {
          heading: 'Cookies',
          body: [
            'Vi använder nödvändiga cookies för att du ska kunna logga in och för att sidan ska fungera. Du kan blockera cookies i din webbläsare, men då kan vissa funktioner sluta fungera.',
          ],
        },
      ]}
    />
  )
}
