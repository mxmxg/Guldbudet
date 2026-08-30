// Versionering av användarvillkoren.
//
// Säljaren godkänner villkoren vid registrering, och villkoren bär
// förmedlingsuppdraget. När säljaren sedan publicerar ett föremål ÄR det
// instruktionen att förmedla, och vi noterar tidpunkten plus vilken lydelse
// som gällde då (items.mandate_accepted_at + items.terms_version).
//
// Utan versionen går det inte att i efterhand visa vad en viss säljare
// faktiskt godkände, vilket är precis vad som efterfrågas om en affär
// ifrågasätts. Med den kan uppdragskvittot renderas som villkoren löd den
// dagen, oavsett hur många gånger texten ändrats sedan dess.
//
// VIKTIGT: höj versionen varje gång villkorstexten ändras i sak, och håll
// den i takt med datumet som visas på /terms. Gamla föremål behåller sin
// version, så historiken går inte förlorad.

export const TERMS_VERSION = '2026-08-29'

// Samma datum i läsbar form. Villkorssidan använder detta, så versionen och
// det publicerade datumet inte kan glida isär.
export const TERMS_UPDATED_LABEL = '29 augusti 2026'
