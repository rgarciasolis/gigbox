#!/usr/bin/env node
// Genera los datos dummy en /data/*.json de forma reproducible.
//
//   npm run seed                 -> genera data/reales y data/dummy con la semilla 42
//   node scripts/seed.mjs --seed=7
//   node scripts/seed.mjs --dataset=dummy   (solo uno de los dos)
//
// Las fechas se guardan RELATIVAS A HOY (dayOffset / minutos) y el adaptador mock las
// convierte a fechas reales al arrancar, asi los datos nunca quedan "viejos".
// Todo es ficticio o generico (ningun nombre de persona real en las resenas), salvo salas, artistas y conciertos
// futuros si existen data/source/songkick-*.json (generados con `node scripts/import-songkick.mjs`): entonces
// se usan esos datos reales y solo el historial pasado, usuarios, resenas, etc. son inventados.
// Sin esos ficheros, los ARTISTAS:
// si existe data/source/artists.json (lista curada de artistas reales, o la que genera `npm run scrape:artists` desde Kulturklik) se usan
// esos nombres; si faltan para llegar a 120, se completan con nombres inventados.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createNormalizer } from './lib/artist-key.mjs'
import { createVenueNormalizer } from './lib/venue-key.mjs'

const DATASETS = ['reales', 'dummy']
const datasetArg = process.argv.find((a) => a.startsWith('--dataset='))
if (!datasetArg) {
  // Sin --dataset genera los dos conjuntos (data/reales y data/dummy)
  for (const d of DATASETS) {
    execFileSync(process.execPath, [fileURLToPath(import.meta.url), `--dataset=${d}`, ...process.argv.slice(2)], { stdio: 'inherit' })
  }
  process.exit(0)
}
const DATASET = datasetArg.split('=')[1]
if (!DATASETS.includes(DATASET)) throw new Error(`--dataset debe ser ${DATASETS.join(' o ')}`)
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', DATASET)
const seedArg = process.argv.find((a) => a.startsWith('--seed='))
const SEED = seedArg ? Number(seedArg.split('=')[1]) : 42

// ---------------------------------------------------------------- PRNG (mulberry32)
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(SEED)
const int = (min, max) => Math.floor(rnd() * (max - min + 1)) + min
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
const chance = (p) => rnd() < p
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
function sample(arr, n) {
  return shuffle(arr).slice(0, n)
}
function weighted(items) {
  // items: [[value, weight], ...]
  const total = items.reduce((s, [, w]) => s + w, 0)
  let r = rnd() * total
  for (const [v, w] of items) {
    r -= w
    if (r <= 0) return v
  }
  return items[items.length - 1][0]
}
function uuid() {
  const h = () => Math.floor(rnd() * 16).toString(16)
  const s = (n) => Array.from({ length: n }, h).join('')
  return `${s(8)}-${s(4)}-4${s(3)}-${'89ab'[Math.floor(rnd() * 4)]}${s(3)}-${s(12)}`
}
const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')

// ---------------------------------------------------------------- Catalogos
const GENRES = [
  'Rock', 'Indie', 'Punk', 'Hardcore', 'Electronica', 'Hip hop', 'Jazz',
  'Folk', 'Pop', 'Metal', 'Soul', 'Reggae', 'Techno', 'Flamenco fusion',
]

const CITIES = [
  ['Madrid', 40.4168, -3.7038, 'España', 5],
  ['Barcelona', 41.3874, 2.1686, 'España', 5],
  ['Bilbao', 43.263, -2.935, 'España', 4],
  ['Valencia', 39.4699, -0.3763, 'España', 3],
  ['Sevilla', 37.3891, -5.9845, 'España', 2],
  ['Zaragoza', 41.6488, -0.8891, 'España', 2],
  ['Málaga', 36.7213, -4.4214, 'España', 2],
  ['Granada', 37.1773, -3.5986, 'España', 1],
  ['Vigo', 42.2406, -8.7207, 'España', 1],
  ['Santander', 43.4623, -3.81, 'España', 1],
  ['Pamplona', 42.8125, -1.6458, 'España', 1],
  ['Valladolid', 41.6523, -4.7245, 'España', 1],
  ['San Sebastián', 43.3183, -1.9812, 'España', 1],
  ['Cádiz', 36.5271, -6.2886, 'España', 1],
  ['Murcia', 37.9922, -1.1307, 'España', 1],
  ['Gijón', 43.5322, -5.6611, 'España', 1],
  ['A Coruña', 43.3623, -8.4115, 'España', 1],
  ['Alicante', 38.3452, -0.481, 'España', 1],
  ['Córdoba', 37.8882, -4.7794, 'España', 1],
  ['Salamanca', 40.9701, -5.6635, 'España', 1],
  ['Lisboa', 38.7223, -9.1393, 'Portugal', 1],
  ['París', 48.8566, 2.3522, 'Francia', 1],
  ['Londres', 51.5072, -0.1276, 'Reino Unido', 1],
  ['Berlín', 52.52, 13.405, 'Alemania', 1],
]

const FIRST_NAMES = [
  'Lucía', 'Marcos', 'Elena', 'Pablo', 'Carmen', 'Álvaro', 'Sara', 'Javier', 'Nuria', 'Iván',
  'Marta', 'Diego', 'Irene', 'Hugo', 'Alba', 'Raúl', 'Clara', 'Sergio', 'Paula', 'Adrián',
  'Laura', 'Óscar', 'Inés', 'Rubén', 'Noa', 'Víctor', 'Eva', 'Gonzalo', 'Julia', 'Mateo',
]
const INITIALS = 'ABCDEFGHJKLMNPRSTV'.split('')

const BIOS = [
  'Voy a conciertos pequeños casi todos los fines de semana.',
  'Más de salas que de festivales.',
  'Colecciono entradas y setlists.',
  'Prefiero primera fila y tapones.',
  'Descubriendo bandas locales.',
  'Del rock al jazz sin avisar.',
  'Me gusta volver a ver a las mismas bandas.',
  'Cuando puedo, viajo por un concierto.',
]

const NOUNS_PL = ['Cuervos', 'Faroles', 'Tiburones', 'Relojes', 'Veletas', 'Pianos', 'Cometas', 'Sombras', 'Aviones', 'Tejados', 'Gatos', 'Trenes', 'Mapas', 'Sirenas', 'Globos']
const ADJ_PL = ['Eléctricos', 'Lentos', 'Azules', 'Dormidos', 'Salvajes', 'Pequeños', 'Nocturnos', 'Rotos', 'Ligeros', 'Oxidados', 'Lejanos']
const NOUNS_SG = ['Hotel', 'Jardín', 'Eco', 'Faro', 'Puente', 'Desierto', 'Archivo', 'Motor', 'Cielo', 'Mar', 'Taller']
const MATERIALS = ['Papel', 'Cristal', 'Humo', 'Sal', 'Ceniza', 'Neón', 'Lluvia', 'Arena', 'Cobre']
const EN_A = ['Midnight', 'Static', 'Velvet', 'Concrete', 'Paper', 'Neon', 'Hollow', 'Silver', 'Slow', 'Pale', 'Quiet']
const EN_B = ['Parade', 'Engine', 'Garden', 'Signal', 'Harbor', 'Echo', 'Season', 'Orchard', 'Tide', 'Compass', 'Choir']
const SYL = ['va', 'no', 'tra', 'mi', 'lo', 'sen', 'dra', 'ku', 'fe', 'ri', 'zo', 'la', 'bre', 'tu', 'ma']

const VENUE_PREFIX = ['Sala', 'Teatro', 'Club', 'Auditorio', 'Café', 'Nave', 'Fábrica']
const VENUE_NAME = ['Aurora', 'Cobre', 'Marea', 'Faro', 'Atlántico', 'Mercurio', 'Lunar', 'Bruma', 'Taller', 'Cantera', 'Vértice', 'Ámbar', 'Delta', 'Órbita', 'Cierzo', 'Pleamar', 'Brasa', 'Umbral', 'Candil', 'Zenit', 'Boreal', 'Ribera', 'Trama', 'Ágora', 'Solsticio', 'Cometa', 'Mirador', 'Almacén', 'Resol', 'Tinta', 'Hangar', 'Kiosko', 'Eclipse', 'Duna', 'Fragua', 'Cascada', 'Vereda', 'Hélice', 'Panorama', 'Nácar']
const STREETS = ['Mayor', 'del Puerto', 'Nueva', 'de la Estación', 'del Río', 'Real', 'de San Roque', 'del Carmen', 'de las Flores', 'de la Luna']

const TAG_NAMES = ['festival', 'sala pequeña', 'primera fila', 'con amigos', 'en solitario', 'acústico', 'sudor', 'imprescindible', 'repetiría', 'fuera de casa']

const LIST_TITLES = [
  ['Mis mejores directos', 'Los conciertos que más recuerdo.'],
  ['Salas pequeñas', 'Aforo reducido y mucho ruido.'],
  ['Festivales', null],
  ['Para ir en grupo', 'Planes con amigos.'],
  ['Pendientes de repetir', null],
  ['Fuera de España', 'Viajes por concierto.'],
]

const R_OPEN = ['Gran noche.', 'Concierto muy completo.', 'Me costó entrar al principio.', 'Sonido impecable.', 'Sala llena y buen ambiente.', 'Directo contundente.', 'Esperaba más.', 'Una sorpresa total.', 'Set corto pero intenso.', 'Teloneros muy correctos.']
const R_DETAIL = ['La banda estuvo ajustada de principio a fin.', 'Las canciones nuevas funcionan mejor en directo que en disco.', 'El volumen era alto pero se distinguía todo.', 'Buena iluminación y mucha energía en los bises.', 'El público cantó casi todo.', 'Hubo un pequeño fallo de sonido a mitad del concierto.', 'Se nota que llevan muchos años tocando juntos.', 'La sala se quedó pequeña para tanta gente.', 'Los medios tiempos fueron lo mejor de la noche.', 'Hubo momentos muy emotivos en la parte acústica.']
const R_CLOSE = ['Repetiría sin dudarlo.', 'Lo recomiendo si tenéis ocasión.', 'Nota justa para lo que ofrecieron.', 'Me fui con ganas de más.', 'Cumple, sin más.', 'Se me pasó volando.', 'Mejor de lo que esperaba.']

// ---------------------------------------------------------------- Generadores
function artistNames(n) {
  const set = new Set()
  while (set.size < n) {
    const kind = int(0, 4)
    let name
    if (kind === 0) name = `Los ${pick(NOUNS_PL)} ${pick(ADJ_PL)}`
    else if (kind === 1) name = `${pick(NOUNS_SG)} de ${pick(MATERIALS)}`
    else if (kind === 2) name = `${pick(EN_A)} ${pick(EN_B)}`
    else if (kind === 3) {
      const s = Array.from({ length: int(2, 3) }, () => pick(SYL)).join('')
      name = s[0].toUpperCase() + s.slice(1)
    } else name = `${pick(MATERIALS)} y ${pick(MATERIALS)}`
    if (!name.includes('y ') || name.split(' ')[0] !== name.split(' ')[2]) set.add(name)
  }
  return [...set]
}

const users = []
const used = new Set()
while (users.length < 30) {
  const first = pick(FIRST_NAMES)
  const initial = pick(INITIALS)
  const display = `${first} ${initial}.`
  const username = `${slug(first)}_${initial.toLowerCase()}${int(10, 99)}`
  if (used.has(username)) continue
  used.add(username)
  const city =
    users.length === 0
      ? 'Bilbao'
      : weighted(CITIES.filter((c) => c[3] === 'España').map((c) => [c[0], c[4]]))
  users.push({
    id: uuid(),
    username,
    displayName: display,
    bio: pick(BIOS),
    city,
    createdDayOffset: -int(30, 900),
  })
}
const ME = users[0]

// Datos reales (Songkick), opcionales
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'data/source')
// En el conjunto "dummy" no se usan: todo es inventado (con la lista curada de artistas si existe)
const SK = DATASET === 'reales' && ['venues', 'artists', 'events'].every((n) => existsSync(join(SRC, `songkick-${n}.json`)))
  ? Object.fromEntries(['venues', 'artists', 'events'].map((n) => [n, JSON.parse(readFileSync(join(SRC, `songkick-${n}.json`), 'utf8'))]))
  : null
// Eventos reales del Excel (`node scripts/import-excel-events.mjs`): opcionales, se suman a los de Songkick
const XL = SK && ['venues', 'artists', 'events'].every((n) => existsSync(join(SRC, `excel-${n}.json`)))
  ? Object.fromEntries(['venues', 'artists', 'events'].map((n) => [n, JSON.parse(readFileSync(join(SRC, `excel-${n}.json`), 'utf8'))]))
  : null
// Fecha en la que se capturaron los datos reales: los dayOffset se calculan respecto a ella
const SK_ANCHOR = Date.UTC(2026, 10, 20)

const MIN_ARTISTS = 120
function loadRealArtists() {
  const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'data/source/artists.json')
  if (!existsSync(file)) return []
  const seen = new Map()
  for (const a of JSON.parse(readFileSync(file, 'utf8'))) {
    const name = (typeof a === 'string' ? a : a.name).trim()
    if (name && !seen.has(name)) seen.set(name, typeof a === 'object' && GENRES.includes(a.genre) ? a.genre : null)
  }
  return [...seen]
}
const skArtistId = new Map()
const skArtistsUnique = []
let artists
if (SK) {
  // Artistas de Songkick sin duplicados: los que comparten clave (articulos, mayusculas, erratas) se unifican
  const norm = createNormalizer(SRC)
  const byKey = new Map()
  artists = []
  for (const a of SK.artists) {
    const k = norm.key(a.name)
    const first = byKey.get(k)
    if (first) {
      skArtistId.set(a.sk, first.id)
      if (!first.genre && a.genre) first.genre = a.genre
      continue
    }
    const id = uuid()
    skArtistId.set(a.sk, id)
    const art = { id, name: norm.display(a.name), genre: a.genre }
    byKey.set(k, art)
    artists.push(art)
    skArtistsUnique.push(a)
  }
  for (const a of XL?.artists ?? []) {
    const id = uuid()
    skArtistId.set(a.id, id)
    artists.push({ id, name: a.name, genre: a.genre })
  }
} else {
  const realArtists = loadRealArtists()
  const realArtistNames = realArtists.map(([n]) => n)
  const realGenre = new Map(realArtists)
  const ARTIST_COUNT = Math.max(MIN_ARTISTS, realArtistNames.length)
  const fakeNames = artistNames(ARTIST_COUNT).filter((n) => !realArtistNames.includes(n))
  const artistList = [...realArtistNames, ...fakeNames].slice(0, ARTIST_COUNT)
  artists = artistList.map((name) => ({ id: uuid(), name, genre: realGenre.get(name) ?? pick(GENRES) }))
}

const venues = []
const skVenueId = new Map()
const skVenuesUnique = []
if (SK) {
  // Salas de Songkick sin duplicados: misma ciudad y misma clave (ver scripts/lib/venue-key.mjs) = misma sala
  const vn = createVenueNormalizer(SRC)
  const byKey = new Map()
  for (const v of SK.venues) {
    const k = vn.key(v.name, v.city)
    const first = byKey.get(k)
    if (first) {
      skVenueId.set(v.sk, first.id)
      if (!first.address && v.address) first.address = v.address
      continue
    }
    const id = uuid()
    skVenueId.set(v.sk, id)
    const venue = { id, name: vn.display(v.name), address: v.address, city: v.city, country: 'España', lat: v.lat, lng: v.lng }
    byKey.set(k, venue)
    venues.push(venue)
    skVenuesUnique.push(v)
  }
  for (const v of XL?.venues ?? []) {
    const id = uuid()
    skVenueId.set(v.id, id)
    venues.push({ id, name: v.name, address: v.address, city: v.city, country: 'España', lat: v.lat, lng: v.lng })
  }
} else {
  {
    const usedNames = new Set()
    const prefixes = shuffle(VENUE_NAME)
    let k = 0
    for (const [city, lat, lng, country, count] of CITIES) {
      for (let i = 0; i < count; i++) {
        const base = prefixes[k++ % prefixes.length]
        const name = `${pick(VENUE_PREFIX)} ${base}`
        if (usedNames.has(name)) {
          i--
          continue
        }
        usedNames.add(name)
        venues.push({
          id: uuid(),
          name,
          address: `Calle ${pick(STREETS)} ${int(1, 80)}`,
          city,
          country,
          lat: Number((lat + (rnd() - 0.5) * 0.04).toFixed(5)),
          lng: Number((lng + (rnd() - 0.5) * 0.04).toFixed(5)),
        })
      }
    }
  }
  if (venues.length !== 40) throw new Error(`Se esperaban 40 salas y hay ${venues.length}`)
}

// Conciertos
const gigs = []
if (SK) {
  // Reales: todos los eventos de Songkick (casi todos futuros). Cartel limitado a 6 artistas (10 en los del Excel).
  for (const e of SK.events) {
    const [y, m, d] = e.date.split('-').map(Number)
    const dayOffset = Math.round((Date.UTC(y, m - 1, d) - SK_ANCHOR) / 86400000)
    const recentlyAdded = chance(dayOffset < 0 ? 0.15 : 0.6)
    gigs.push({
      id: uuid(),
      artistIds: [...new Set(e.artists.map((id) => skArtistId.get(id)))].slice(0, 6),
      venueId: skVenueId.get(e.venue),
      dayOffset,
      hour: e.hour ?? int(20, 22),
      imageUrl: null,
      createdMinOffset: -(recentlyAdded ? int(10, 60 * 24 * 40) : int(60 * 24 * 40, 60 * 24 * 400)),
    })
  }
  // Eventos del Excel (pasados y futuros). El Excel no trae hora: se reparte entre las 20 y las 22.
  for (const e of XL?.events ?? []) {
    const [y, m, d] = e.date.split('-').map(Number)
    const dayOffset = Math.round((Date.UTC(y, m - 1, d) - SK_ANCHOR) / 86400000)
    gigs.push({
      id: uuid(),
      artistIds: [...new Set(e.artists.map((id) => skArtistId.get(id)))],
      venueId: skVenueId.get(e.venue),
      dayOffset,
      hour: int(20, 22),
      imageUrl: null,
      createdMinOffset: -(chance(dayOffset < 0 ? 0.15 : 0.6) ? int(10, 60 * 24 * 40) : int(60 * 24 * 40, 60 * 24 * 400)),
    })
  }
  // Sinteticos: historial pasado con artistas y salas reales (Songkick solo trae agenda futura)
  const evCount = new Map()
  for (const e of [...SK.events, ...(XL?.events ?? [])]) evCount.set(e.venue, (evCount.get(e.venue) ?? 0) + 1)
  const weightById = new Map()
  for (const k of [...SK.venues.map((v) => v.sk), ...(XL?.venues ?? []).map((v) => v.id)]) {
    const id = skVenueId.get(k)
    weightById.set(id, (weightById.get(id) ?? 0) + (evCount.get(k) ?? 1))
  }
  const venueW = [...weightById]
  const realPast = gigs.filter((g) => g.dayOffset < 0).length
  for (let i = realPast; i < 205; i++) {
    gigs.push({
      id: uuid(),
      artistIds: sample(artists, weighted([[1, 3], [2, 4], [3, 2]])).map((a) => a.id),
      venueId: weighted(venueW),
      dayOffset: -int(1, 900),
      hour: int(19, 22),
      imageUrl: null,
      createdMinOffset: -(chance(0.15) ? int(10, 60 * 24 * 40) : int(60 * 24 * 40, 60 * 24 * 400)),
    })
  }
} else {
  // 205 pasados + 95 futuros
  const venueWeights = venues.map((v) => [v, ['Madrid', 'Barcelona', 'Bilbao', 'Valencia'].includes(v.city) ? 4 : 1])
  for (let i = 0; i < 300; i++) {
    const past = i < 205
    const venue = weighted(venueWeights)
    const lineup = sample(artists, weighted([[1, 3], [2, 4], [3, 2]])).map((a) => a.id)
    const recentlyAdded = chance(past ? 0.15 : 0.6)
    gigs.push({
      id: uuid(),
      artistIds: lineup,
      venueId: venue.id,
      dayOffset: past ? -int(1, 900) : int(1, 270),
      hour: int(19, 22),
      imageUrl: null,
      createdMinOffset: -(recentlyAdded ? int(10, 60 * 24 * 40) : int(60 * 24 * 40, 60 * 24 * 400)),
    })
  }
}
const gigById = new Map(gigs.map((g) => [g.id, g]))
const pastGigs = gigs.filter((g) => g.dayOffset < 0)
const futureGigs = gigs.filter((g) => g.dayOffset > 0)

// Tags por usuario
const tags = []
const tagsByUser = new Map()
for (const u of users) {
  const mine = sample(TAG_NAMES, int(3, 6)).map((name) => ({ id: uuid(), userId: u.id, name }))
  tags.push(...mine)
  tagsByUser.set(u.id, mine)
}

// Asistencias: 500 (45 para el usuario dummy)
const attendances = []
const pairKey = new Set()
function addAttendance(user, gig) {
  const key = `${user.id}:${gig.id}`
  if (pairKey.has(key)) return false
  pairKey.add(key)
  const rating = chance(0.12) ? null : Math.min(5, Math.max(0.5, Math.round((weighted([[2.5, 1], [3, 2], [3.5, 3], [4, 4], [4.5, 3], [5, 2], [1.5, 1]]) + (rnd() - 0.5)) * 2) / 2))
  const review = rating !== null && chance(0.6) ? [pick(R_OPEN), pick(R_DETAIL), pick(R_CLOSE)].slice(0, int(2, 3)).join(' ') : null
  const myTags = tagsByUser.get(user.id)
  attendances.push({
    id: uuid(),
    userId: user.id,
    gigId: gig.id,
    rating,
    review,
    tagIds: sample(myTags, int(0, 2)).map((t) => t.id),
    photoUrl: null,
    createdMinOffset: Math.min(-5, gig.dayOffset * 1440 + int(60, 60 * 24 * 2)),
  })
  return true
}
for (const g of sample(pastGigs, 45)) addAttendance(ME, g)
while (attendances.length < 500) {
  addAttendance(pick(users.slice(1)), pick(pastGigs))
}
const attendedByMe = new Set(attendances.filter((a) => a.userId === ME.id).map((a) => a.gigId))

// Wishlist (una por usuario) + listas personales
const gigslists = []
for (const u of users) {
  const n = u.id === ME.id ? 12 : int(4, 14)
  const items = sample(futureGigs, n).map((g) => ({
    gigId: g.id,
    addedMinOffset: -int(30, 60 * 24 * 45),
    ticketStatus: chance(0.35) ? 'has_ticket' : 'no_ticket',
  }))
  if (u.id === ME.id) {
    // Dos conciertos ya pasados en la wishlist para probar "confirmar asistencia"
    const recentPast = pastGigs.filter((g) => g.dayOffset >= -40 && !attendedByMe.has(g.id))
    for (const g of sample(recentPast, 2)) {
      items.push({ gigId: g.id, addedMinOffset: -60 * 24 * 60, ticketStatus: 'has_ticket' })
    }
  }
  gigslists.push({ id: uuid(), userId: u.id, kind: 'wishlist', title: 'Wishlist', description: null, items })
  const customCount = u.id === ME.id ? 3 : int(0, 2)
  for (const [title, description] of sample(LIST_TITLES, customCount)) {
    gigslists.push({
      id: uuid(),
      userId: u.id,
      kind: 'custom',
      title,
      description,
      items: sample(gigs, int(3, 8)).map((g) => ({ gigId: g.id, addedMinOffset: -int(60, 60 * 24 * 120), ticketStatus: 'no_ticket' })),
    })
  }
}

// Amistades (follows). El usuario dummy sigue a 9 y es seguido por varios.
const follows = []
const followKey = new Set()
function addFollow(a, b) {
  const k = `${a.id}>${b.id}`
  if (a.id === b.id || followKey.has(k)) return
  followKey.add(k)
  follows.push({ followerId: a.id, followeeId: b.id, createdMinOffset: -int(60, 60 * 24 * 300) })
}
for (const f of sample(users.slice(1), 9)) addFollow(ME, f)
for (const f of sample(users.slice(1), 6)) addFollow(f, ME)
for (const u of users.slice(1)) for (const f of sample(users.filter((x) => x.id !== u.id), int(3, 10))) addFollow(u, f)

// Likes de conciertos y de resenas
const gigLikes = []
const likeKey = new Set()
function addGigLike(userId, gigId) {
  const k = `${userId}:${gigId}`
  if (likeKey.has(k)) return
  likeKey.add(k)
  gigLikes.push({ userId, gigId })
}
for (const a of attendances) if (chance(0.35)) addGigLike(a.userId, a.gigId)
for (let i = 0; i < 80; i++) addGigLike(pick(users).id, pick(futureGigs).id)

const reviewLikes = []
const rlKey = new Set()
const reviewed = attendances.filter((a) => a.review)
for (let i = 0; i < 300; i++) {
  const a = pick(reviewed)
  const u = pick(users)
  const k = `${u.id}:${a.id}`
  if (u.id === a.userId || rlKey.has(k)) continue
  rlKey.add(k)
  reviewLikes.push({ userId: u.id, attendanceId: a.id })
}

// Actividad
const activities = []
for (const a of attendances) {
  activities.push({ id: uuid(), userId: a.userId, type: 'attended', gigId: a.gigId, attendanceId: a.id, createdMinOffset: a.createdMinOffset })
  if (a.review) activities.push({ id: uuid(), userId: a.userId, type: 'review', gigId: a.gigId, attendanceId: a.id, createdMinOffset: a.createdMinOffset + 1 })
}
for (const l of gigslists.filter((x) => x.kind === 'wishlist')) {
  for (const it of l.items) activities.push({ id: uuid(), userId: l.userId, type: 'wishlist_add', gigId: it.gigId, attendanceId: null, createdMinOffset: it.addedMinOffset })
}

// Favoritos: los 5 mejor puntuados de cada usuario
const favorites = users.map((u) => {
  const mine = attendances.filter((a) => a.userId === u.id && a.rating !== null).sort((a, b) => b.rating - a.rating)
  return { userId: u.id, gigIds: mine.slice(0, 5).map((a) => a.gigId) }
})

// Referencias externas (ids ficticios)
const externalRefs = SK
  ? [
      ...skArtistsUnique.map((a) => ({ id: uuid(), entityType: 'artist', entityId: skArtistId.get(a.sk), provider: 'songkick', externalId: a.sk.replace('sk-artist-', '') })),
      ...skVenuesUnique.map((v) => ({ id: uuid(), entityType: 'venue', entityId: skVenueId.get(v.sk), provider: 'songkick', externalId: v.sk.replace('sk-venue-', '') })),
    ]
  : [
      ...sample(artists, 70).map((a) => ({ id: uuid(), entityType: 'artist', entityId: a.id, provider: 'musicbrainz', externalId: uuid() })),
      ...sample(gigs, 100).map((g) => ({ id: uuid(), entityType: 'gig', entityId: g.id, provider: 'ticketmaster', externalId: `tm_${int(100000, 999999)}` })),
      ...sample(venues, 20).map((v) => ({ id: uuid(), entityType: 'venue', entityId: v.id, provider: 'ticketmaster', externalId: `tmv_${int(1000, 9999)}` })),
    ]

// ---------------------------------------------------------------- v0.7: seguir artistas y avisos
// Se genera AL FINAL para no alterar los datos anteriores con la misma semilla.
const MY_CITY_VENUES = new Set(venues.filter((v) => v.city === ME.city).map((v) => v.id))
const RECENT_MIN = 60 * 24 * 40 // "anadido recientemente" = ultimos 40 dias
const recentFuture = futureGigs.filter((g) => g.createdMinOffset >= -RECENT_MIN)

// El usuario dummy sigue ~8 artistas: algunos con conciertos nuevos en su ciudad (dentro del
// radio por defecto), otros con conciertos nuevos lejos (fuera) y otros de su historico.
const meFollowIds = new Set()
for (const g of sample(recentFuture.filter((g) => MY_CITY_VENUES.has(g.venueId)), 2)) meFollowIds.add(g.artistIds[0])
for (const g of sample(recentFuture.filter((g) => !MY_CITY_VENUES.has(g.venueId)), 3)) meFollowIds.add(g.artistIds[0])
const attendedArtistIds = [...new Set(attendances.filter((a) => a.userId === ME.id).flatMap((a) => gigById.get(a.gigId).artistIds))]
for (const id of sample(attendedArtistIds, 8)) {
  if (meFollowIds.size >= 8) break
  meFollowIds.add(id)
}

const artistFollows = [...meFollowIds].map((artistId) => ({ userId: ME.id, artistId, createdMinOffset: -int(60, 60 * 24 * 200) }))
for (const u of users.slice(1)) {
  for (const a of sample(artists, int(3, 10))) artistFollows.push({ userId: u.id, artistId: a.id, createdMinOffset: -int(60, 60 * 24 * 200) })
}

// Avisos del usuario dummy, derivados de datos reales del seed. Mezcla de leidos y sin leer.
const notifications = []
const note = (n) => notifications.push({ id: uuid(), userId: ME.id, actorId: null, gigId: null, artistId: null, attendanceId: null, read: chance(0.4), ...n })
for (const g of recentFuture) {
  const hit = g.artistIds.find((id) => meFollowIds.has(id))
  if (hit) note({ type: 'artist_gig_announced', createdMinOffset: g.createdMinOffset, gigId: g.id, artistId: hit })
}
const myAttendanceById = new Map(attendances.filter((a) => a.userId === ME.id).map((a) => [a.id, a]))
for (const l of reviewLikes) {
  const att = myAttendanceById.get(l.attendanceId)
  if (att) note({ type: 'review_like', createdMinOffset: Math.min(-5, att.createdMinOffset + int(60, 60 * 24 * 20)), actorId: l.userId, gigId: att.gigId, attendanceId: att.id })
}
for (const f of follows.filter((x) => x.followeeId === ME.id)) {
  note({ type: 'new_follower', createdMinOffset: f.createdMinOffset, actorId: f.followerId })
}

const meta = {
  seed: SEED,
  currentUserId: ME.id,
  note: 'Fechas relativas a hoy: dayOffset en dias, *MinOffset en minutos respecto a "ahora".',
  counts: {
    users: users.length, artists: artists.length, venues: venues.length, gigs: gigs.length,
    attendances: attendances.length, gigslists: gigslists.length, tags: tags.length, follows: follows.length,
    artistFollows: artistFollows.length, notifications: notifications.length,
  },
}

mkdirSync(OUT, { recursive: true })
const files = { users, artists, venues, gigs, attendances, tags, gigslists, follows, activities, gigLikes, reviewLikes, favorites, externalRefs, artistFollows, notifications, meta }
for (const [name, data] of Object.entries(files)) {
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(data, null, 1) + '\n')
}
console.log(`Seed ${SEED} -> ${OUT}`)
console.log(meta.counts)
