// Personnummer: normalisering och formatkontroll.
//
// Finns för att personnumret är nyckeln som binder ihop en fysisk person med
// alla deras affärer. Penningtvättströskeln är kumulativ över 12 månader, så om
// samma person kan finnas som två olika strängar (eller som två konton) räknas
// deras affärer var för sig och tröskeln passeras aldrig.
//
// Därför lagras alltid den normaliserade tolvsiffriga formen, och bara den.

// Luhn (modulus 10) över den tiosiffriga formen, alltså sista tio siffrorna.
// Kontrollsiffran är den sista. Det här är det som skiljer ett riktigt
// personnummer från en godtycklig identifierare, till exempel ett OIDC-subject.
function luhnOk(tenDigits: string): boolean {
  if (!/^\d{10}$/.test(tenDigits)) return false
  let sum = 0
  for (let i = 0; i < 10; i++) {
    let d = tenDigits.charCodeAt(i) - 48
    // Varannan siffra dubbleras, med start på den första.
    if (i % 2 === 0) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return sum % 10 === 0
}

// Tar emot de former ett personnummer förekommer i och ger tillbaka exakt tolv
// siffror, eller null om strängen inte är ett giltigt personnummer.
//
// Accepterar YYMMDDXXXX, YYMMDD-XXXX, YYMMDD+XXXX (hundra år eller äldre),
// YYYYMMDDXXXX och YYYYMMDD-XXXX. Mellanslag och andra skiljetecken ignoreras.
//
// Samordningsnummer (dag plus 60) går igenom: de har samma kontrollsiffra och
// är en giltig identitet hos BankID.
export function normalizeSsn(raw: string | null | undefined): string | null {
  if (!raw) return null
  const s = String(raw).trim()
  if (!s) return null
  // Plustecknet betyder att personen fyllt 100, alltså ett sekel tidigare.
  const centenarian = s.includes('+')
  const digits = s.replace(/\D/g, '')

  let twelve: string
  if (digits.length === 12) {
    twelve = digits
  } else if (digits.length === 10) {
    // Härled århundradet ur födelseåret: ett tvåsiffrigt år som skulle hamna i
    // framtiden hör till förra seklet.
    const yy = Number(digits.slice(0, 2))
    const thisYear = new Date().getFullYear()
    let year = Math.floor(thisYear / 100) * 100 + yy
    if (year > thisYear) year -= 100
    if (centenarian) year -= 100
    twelve = String(year) + digits.slice(2)
  } else {
    return null
  }

  if (!/^\d{12}$/.test(twelve)) return null
  if (!luhnOk(twelve.slice(2))) return null
  return twelve
}

// Sant om strängen är ett personnummer i någon av de accepterade formerna.
export function isValidSsn(raw: string | null | undefined): boolean {
  return normalizeSsn(raw) !== null
}

// Är BankID skarpt? Byggtidsflagga, bakas in i webbläsarbundlen.
//
// Ligger här som en enda export i stället för att jämförelsen upprepas i varje
// komponent som behöver den. Fyra ytor läser den nu: säljarens listningsgrind,
// handlarens budruta, handlarpanelen och verifieringssidan. Databasen kan inte
// läsa den alls, så motsvarande krav i schemat är skrivet för hand och märkt
// med var or-grenen ska bort på lanseringsdagen.
export const BANKID_LIVE = process.env.NEXT_PUBLIC_BANKID_ENABLED === 'true'
