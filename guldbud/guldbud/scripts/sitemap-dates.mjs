// Genererar lib/pageUpdated.ts, alltså sitemapens lastmod per sida.
//
// Varför ett skript i stället för ett fält att fylla i för hand: datumen sattes
// tidigare manuellt, och en manuell rad blir fel så fort någon glömmer den. En
// sitemap som säger att en ändrad sida är oförändrad får Google att hämta den
// senare än den borde.
//
// Varför inte byggtiden: en sitemap som påstår att varje sida ändrades vid
// senaste deployen ljuger vid varje deploy, och då slutar Google lita på
// uppgiften. Filens mtime duger inte heller, eftersom en git-utcheckning sätter
// samma tid på alla filer.
//
// Källan är därför git: när filen senast ändrades i sak. Har filen oskrivna
// ändringar i arbetsträdet används dagens datum, eftersom den är på väg att
// committas nu.
//
// Sidorna hittas automatiskt under app/. Lägger du till en ny guide hamnar den
// alltså i sitemapen utan att någon behöver komma ihåg det. Undantagen nedan
// speglar app/robots.ts: kontosidor ska inte indexeras och ska inte ligga här.

import { execFileSync } from 'node:child_process'
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const APP = join(ROOT, 'app')
const OUT = join(ROOT, 'lib', 'pageUpdated.ts')

// Samma lista som app/robots.ts stänger ute, plus tekniska rutter.
const EXCLUDED = [
  '/admin',
  '/dealer/dashboard',
  '/dealer/profile',
  '/customer',
  '/orders',
  '/auth',
  '/meddelanden',
  '/api',
  // Verifieringssidan kräver inloggning och har inget värde i sökresultatet.
  '/verifiering',
]

function routes(dir = APP, prefix = '') {
  const found = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (!statSync(full).isDirectory()) continue
    // Dynamiska segment kan inte listas statiskt. Auktionssidorna hämtas i
    // stället ur databasen i app/sitemap.ts.
    if (entry.startsWith('[') || entry.startsWith('_') || entry.startsWith('.')) continue
    found.push(...routes(full, `${prefix}/${entry}`))
  }
  try {
    statSync(join(dir, 'page.tsx'))
    found.push({ route: prefix, file: join(dir, 'page.tsx') })
  } catch {
    // Ingen sida i den här katalogen, bara underkataloger.
  }
  return found
}

function lastChanged(file) {
  const rel = file.slice(ROOT.length + 1)
  // Oskrivna ändringar: filen är på väg att committas idag.
  const dirty = execFileSync('git', ['status', '--porcelain', '--', rel], {
    cwd: ROOT,
    encoding: 'utf8',
    // Tyst på stderr: saknas git svarar vi ändå med null och hoppar över.
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()
  if (dirty) return new Date().toISOString().slice(0, 10)
  const committed = execFileSync('git', ['log', '-1', '--format=%cs', '--', rel], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()
  return committed || null
}

const found = routes()
  .filter((r) => !EXCLUDED.some((e) => r.route === e || r.route.startsWith(e + '/')))
  .sort((a, b) => a.route.localeCompare(b.route, 'sv'))

const rows = []
let missing = 0
for (const { route, file } of found) {
  let date = null
  try {
    date = lastChanged(file)
  } catch {
    // git saknas eller svarar inte.
  }
  if (!date) {
    missing++
    continue
  }
  rows.push(`  '${route}': '${date}',`)
}

// Skriv aldrig en ofullständig fil.
//
// Byggmiljöer klonar ofta grunt, och då saknar en del filer historik. Att skriva
// filen ändå hade tyst tagit bort sidor ur sitemapen vid varje deploy. Den
// committade filen är alltid komplett, eftersom den skapas här lokalt där hela
// historiken finns, så det säkra är att låta den vara.
if (missing > 0 || rows.length === 0) {
  console.log(
    `sitemap-dates: hoppar över, ${missing} av ${found.length} sidor saknar git-historik. ` +
      'Den committade lib/pageUpdated.ts används oförändrad.'
  )
  process.exit(0)
}

const body = `// GENERERAD FIL. Ändra inte för hand.
// Skapas av scripts/sitemap-dates.mjs, som körs automatiskt före varje bygge.
// Datumen kommer ur git: när sidans fil senast ändrades.

export const PAGE_UPDATED: Record<string, string> = {
${rows.join('\n')}
}
`

writeFileSync(OUT, body, 'utf8')
console.log(`sitemap-dates: ${rows.length} sidor daterade ur git`)
