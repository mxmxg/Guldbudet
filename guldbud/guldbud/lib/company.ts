// Bolagsuppgifterna, på ett ställe.
//
// Låg tidigare som tre identiska kopior av samma objekt, i uppdragskvittot, i
// fakturasidan och i PDF-versionen, plus lösa strängar i sidfoten och
// mejlmallen. Uppgifter som står på flera ställen glider isär, och just de här
// syns i handlingar som går till handlare, revisor och Skatteverket. Ett
// felaktigt org.nummer i ett underlag är inte ett skönhetsfel.
//
// Namnet är GuldBud AB, beslutat av användaren: alla dokument skrivs för det
// namnet, även de som går till utomstående. Att bolaget står som Hey Consulting
// Nordic AB i registret tills namnbytet gått igenom hör hemma i ett svar till
// användaren, inte i en handling. Se CLAUDE.md under affärsfakta.
//
// Adressen är postboxen, inte den registrerade gatuadressen. Det är dit guldet
// skickas och den som ska stå i handlingar. Blanda dem aldrig: kombinationen
// gatuadress plus boxens postnummer existerar inte.

export const GULDBUD = {
  name: 'GuldBud AB',
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
// ingår (SEB:s serie). Etiketten läses gemen i fakturans löptext, därför
// 'Konto' och inte 'Kontonummer (SEB)'.
export const CLIENT_FUNDS_ACCOUNT = {
  label: 'Konto',
  number: '5232 10 078 77',
} as const
