// Recoge nombres de artistas de la agenda de conciertos de Kulturklik (https://www.kulturklik.euskadi.eus)
// y escribe data/source/artists.json, que `npm run seed` usa en lugar de los artistas inventados.
// Solo se aprovechan los artistas: salas, conciertos, usuarios y reseñas siguen siendo dummy.
//
// Uso:   npm run scrape:artists
//        node scripts/scrape-kulturklik.mjs [--url <listado>] [--max-pages 5] [--delay 1500] [--refresh]
//
// Es respetuoso: una peticion cada --delay ms, cache en data/source/.cache y User-Agent identificable.
// Antes de usarlo, revisa robots.txt y el aviso legal de la web. Requiere Node 18+ (fetch).
// OJO: los selectores estan escritos sin haber visto el HTML real. Si extrae mal, mira
// data/source/kulturklik-raw.json (titulos tal cual) y ajusta `cleanTitle`.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'data/source')
const CACHE = join(OUT, '.cache')

// Listado de conciertos (tipo=1), tal como enlaza la portada.
const DEFAULT_URL =
  'https://www.kulturklik.euskadi.eus/webkklik00-shagenda/eu/aa58aPublicoWar/agenda/sacarAgendaDia?locale=eu&tipo=1'

const args = process.argv.slice(2)
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : def
}
const START = opt('url', DEFAULT_URL)
const MAX_PAGES = Number(opt('max-pages', 5))
const DELAY = Number(opt('delay', 1500))
const REFRESH = args.includes('--refresh')
const UA = 'gigbox-mvp-seed/0.1 (proyecto personal; solo nombres de artistas)'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function get(url) {
  const file = join(CACHE, createHash('sha1').update(url).digest('hex') + '.html')
  if (!REFRESH) {
    try {
      return await readFile(file, 'utf8')
    } catch {}
  }
  await sleep(DELAY)
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'es,eu;q=0.8' } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  const html = await res.text()
  await mkdir(CACHE, { recursive: true })
  await writeFile(file, html)
  return html
}

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

/** Enlaces de la pagina: eventos (/ekitaldia/) y paginas siguientes (firstRow=). */
export function extractLinks(html, base) {
  const events = new Set()
  const pages = new Set()
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const href = decode(m[1])
    let abs
    try {
      abs = new URL(href, base).toString()
    } catch {
      continue
    }
    if (/\/ekitaldia\/\d{4}\/\d{2}\/\d{2}\//.test(abs) || /\/evento\/\d{4}\/\d{2}\/\d{2}\//.test(abs)) events.add(abs)
    else if (/sacarAgendaDia/.test(abs) && /tipo=1\b/.test(abs) && /firstRow=/.test(abs)) pages.add(abs)
  }
  return { events: [...events], pages: [...pages] }
}

export function extractTitle(html) {
  const og = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)
  if (og) return decode(og[1])
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  if (h1) return decode(h1[1])
  const t = html.match(/<title>([\s\S]*?)<\/title>/i)
  return t ? decode(t[1]).replace(/\s*[|\-–]\s*Kulturklik.*$/i, '') : ''
}

/** Titulo de evento -> nombre de artista probable. Heuristica; revisar a mano el resultado. */
export function cleanTitle(title) {
  let t = title
    .replace(/\b(19|20)\d{2}\b/g, '') // anios
    .replace(/\b(kontzertua|concierto|concert|bira|gira|tour|zuzenean|en directo|live)\b/gi, '')
    .replace(/^\s*[\w\s]+(jaialdia|festival|jaialdi)\s*[:\-–]\s*/i, '') // "Festival X: Artista"
  t = t.split(/\s[-–]\s|:\s|\s\|\s/)[0] // "Artista - gira", "Artista: titulo"
  t = t.replace(/[“”"«»]/g, '').replace(/\s+/g, ' ').trim()
  return t
}

// Titulos que son festivales, ciclos o eventos genericos, no artistas.
const NOT_ARTIST =
  /(jaialdia|festival|zinebi|ficab|tartalo|zikloa|ciclo|erakusketa|azoka|feria|dantza|antzerki|hitzaldi|ikastaro|lehiaketa|ekitaldi|programa|concurso|taller)/i

async function main() {
  const queue = [START]
  const seenPages = new Set()
  const eventUrls = new Set()
  while (queue.length && seenPages.size < MAX_PAGES) {
    const url = queue.shift()
    if (seenPages.has(url)) continue
    seenPages.add(url)
    console.log(`listado ${seenPages.size}/${MAX_PAGES}: ${url}`)
    const { events, pages } = extractLinks(await get(url), url)
    events.forEach((e) => eventUrls.add(e))
    queue.push(...pages)
  }
  console.log(`${eventUrls.size} eventos encontrados`)

  const raw = []
  for (const url of eventUrls) {
    try {
      const title = extractTitle(await get(url))
      const date = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//)?.slice(1).join('-') ?? null
      if (title) raw.push({ url, date, title })
    } catch (e) {
      console.warn('saltado', url, e.message)
    }
  }

  const names = new Map()
  for (const r of raw) {
    if (NOT_ARTIST.test(r.title)) continue
    const name = cleanTitle(r.title)
    if (name.length < 2 || name.length > 60) continue
    names.set(name.toLowerCase(), name)
  }
  const artists = [...names.values()].sort((a, b) => a.localeCompare(b, 'es')).map((name) => ({ name }))

  await mkdir(OUT, { recursive: true })
  await writeFile(join(OUT, 'kulturklik-raw.json'), JSON.stringify(raw, null, 2) + '\n')
  await writeFile(join(OUT, 'artists.json'), JSON.stringify(artists, null, 2) + '\n')
  console.log(`${raw.length} titulos -> ${artists.length} artistas en data/source/artists.json`)
  console.log('Revisa el fichero (quita lo que no sea un artista) y ejecuta: npm run seed')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
