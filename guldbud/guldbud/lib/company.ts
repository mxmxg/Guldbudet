// Bolagsuppgifterna, på ett ställe.
//
// Låg tidigare som tre identiska kopior av samma objekt, i uppdragskvittot, i
// fakturasidan och i PDF-versionen, plus lösa strängar i sidfoten och
// mejlmallen. Uppgifter som står på flera ställen glider isär, och just de här
// syns i handlingar som går till handlare, revisor och Skatteverket. Ett
// felaktigt org.nummer i ett underlag är inte ett skönhetsfel.
//
// Namnet är Guldbud Sverige AB, registrerat hos Bolagsverket 2026-09-11,
// ärende 477319/2026. Stavningen följer registret, alltså litet u och d.
// GuldBud med stort B är varumärket och används i löptext, aldrig som
// bolagsnamn i en handling.
//
// Tidigare hette bolaget Hey Consulting Nordic AB. Dokumenten skrevs en period
// för "GuldBud AB", ett namn Bolagsverket avslog som för generiskt. Det namnet
// har alltså aldrig funnits och ska inte tillbaka någonstans.
//
// Adressen är postboxen, inte den registrerade gatuadressen. Det är dit guldet
// skickas och den som ska stå i handlingar. Blanda dem aldrig: kombinationen
// gatuadress plus boxens postnummer existerar inte.

export const GULDBUD = {
  name: 'Guldbud Sverige AB',
  org: '559291-4781',
  // Momsnumret visas BARA på GuldBuds egen faktura, aldrig på handlarens
  // inköpsunderlag. Varuledet mellan privatperson och handlare är momsfritt,
  // tjänsteledet mellan GuldBud och handlare är momspliktigt, och den
  // uppdelningen är hela den juridiska poängen med de tre dokumenten.
  vat: 'SE559291478101',
  email: 'info@guldbud.com',
  box: 'Box 6007',
  postal: '102 31 Stockholm',
} as const

// Adressen på en rad, för sidfot och mejlmallar.
export const GULDBUD_ADDRESS_LINE = `${GULDBUD.box}, ${GULDBUD.postal}`

// Klientmedelskontot hos SEB dit handlarens betalning går, beslutat
// 2026-09-01: lansering med faktura och banköverföring, kortbetalningen
// vilande. Kontot öppnades 2026-09-01 och numret är användarens uppgift
// samma dag, kontrollsiffran verifierad med mod-11. Clearingnumret 5232
// ingår (SEB:s serie). OBS: bolagets vanliga rörelsekonto är ett annat
// SEB-nummer och får aldrig stå här, det är precis den sammanblandningen
// klientmedelsupplägget finns för att förhindra. Rättat 2026-09-01 efter
// att rörelsekontots nummer först lagts in av misstag. Etiketten läses
// gemen i fakturans löptext, därför 'Konto'.
export const CLIENT_FUNDS_ACCOUNT = {
  label: 'Konto',
  number: '5232 10 274 52',
} as const
