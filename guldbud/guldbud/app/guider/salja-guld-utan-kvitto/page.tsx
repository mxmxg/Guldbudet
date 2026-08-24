import type { Metadata } from 'next'
import GuideShell, { H2, P, UL, A } from '@/components/GuideShell'

export const metadata: Metadata = {
  title: 'Sälja guld utan kvitto, går det?',
  description:
    'Kan man sälja guld utan kvitto? Ja. Så fungerar det när du saknar originalkvittot på ärvda eller gamla smycken, vad som efterfrågas i stället och hur du säljer tryggt.',
  alternates: { canonical: '/guider/salja-guld-utan-kvitto' },
}

const faq = [
  {
    q: 'Kan jag sälja guld utan kvitto?',
    a: 'Ja. De allra flesta säljer guld de ärvt, fått i present eller ägt i många år, då finns sällan något kvitto kvar. Det är helt normalt och inget hinder. Vi frågar bara efter en enkel bekräftelse på hur du kom över föremålet, som en trygghet för alla.',
  },
  {
    q: 'Vad behöver jag i stället för kvitto?',
    a: 'Inget särskilt dokument. Vid inlämning gör du en kort ägarbekräftelse (till exempel arv, present eller eget köp) och intygar att föremålet är ditt. Vid utbetalning verifierar vi din identitet, det är spårbart och tryggt, men du behöver inget gammalt kvitto.',
  },
  {
    q: 'Varför frågar ni om ursprunget om det inte krävs kvitto?',
    a: 'För allas trygghet handlar vi bara med guld med känt ursprung, och som kontantfri plattform (spårbar in- och utbetalning) håller vi affärerna rena. Det är en enkel bekräftelse, inte ett förhör, och den behövs inte styrkas med kvitto.',
  },
]

export default function Page() {
  return (
    <GuideShell
      eyebrow="Guide · Utan kvitto"
      title="Sälja guld utan kvitto, det går alldeles utmärkt"
      intro="Ärvda ringar, en present för 20 år sedan, en gammal kedja i byrålådan, nästan ingen har kvar kvittot. Här reder vi ut vad som faktiskt gäller när du vill sälja guld utan originalkvitto."
      updated="2026"
      faq={faq}
    >
      <H2>Kvitto behövs nästan aldrig</H2>
      <P>
        Det vanligaste guldet som säljs är sådant man <strong>ärvt, fått eller ägt länge</strong>. Då finns sällan något
        kvitto, och det är helt väntat. Att sakna kvitto sänker inte värdet och hindrar dig inte från att sälja. Värdet
        avgörs av vikten, karaten och <A href="/guider/guldpris-idag">dagens guldpris</A>, inte av ett papper.
      </P>

      <H2>Vad vi frågar om i stället</H2>
      <P>
        När du lägger ut ett föremål gör du en enkel <strong>ägarbekräftelse</strong>: du väljer hur du kom över det
        (till exempel arv, present eller eget köp) och intygar att det är ditt. Det tar några sekunder och behöver inte
        styrkas med kvitto. Det är en trygghet, inte ett hinder.
      </P>
      <UL>
        <li>Ingen originalkvittens krävs.</li>
        <li>En kort ägarbekräftelse vid inlämning räcker.</li>
        <li>Identiteten verifieras vid utbetalning, spårbart och tryggt.</li>
      </UL>

      <H2>Därför är det ändå säkert</H2>
      <P>
        GuldBud är helt <strong>kontantfritt</strong>, både betalning in och utbetalning ut sker spårbart via bank eller
        Swish. Det gör affärerna trygga och rena utan att du behöver gräva fram gamla papper. Handlarna är dessutom
        manuellt verifierade, så du vet att seriösa köpare står bakom varje bud.
      </P>

      <H2>Så säljer du ärvt eller gammalt guld</H2>
      <P>
        Har du ärvt smycken du inte använder? Läs vår guide om <A href="/guider/salja-arvguld">att sälja arvguld</A>, eller
        lägg ut direkt och låt handlarna tävla. Osäker på värdet? Testa{' '}
        <A href="/#estimator">värderingskalkylatorn</A> med bara vikt och karat.
      </P>
    </GuideShell>
  )
}
