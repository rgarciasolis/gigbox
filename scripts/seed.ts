/**
 * Seed reproducible de datos dummy.
 * Uso: npm run seed [-- --seed=42 --today=2026-11-16]
 * Escribe public/data/*.json. Misma seed + misma fecha => mismos datos.
 * Las fechas se generan relativas a `today`; el adaptador mock las desplaza a la fecha real de hoy al cargar.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type {
  Activity, Artist, Attendance, ExternalRef, Follow, Gig, Gigslist, SeedMeta, Tag, User, Venue,
} from '../src/domain/types'

const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=') as [string, string]),
)
const SEED = Number(args.seed ?? 42)
const TODAY = args.today ?? new Date().toISOString().slice(0, 10)
const todayMs = Date.parse(`${TODAY}T00:00:00.000Z`)

function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(SEED)
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]
const chance = (p: number) => rnd() < p
function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}
function sample<T>(arr: readonly T[], n: number): T[] { return shuffle(arr).slice(0, n) }
function uuid(): string {
  const h = Array.from({ length: 16 }, () => int(0, 255))
  h[6] = (h[6] & 0x0f) | 0x40
  h[8] = (h[8] & 0x3f) | 0x80
  const x = h.map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`
}
const iso = (ms: number) => new Date(ms).toISOString()
const DAY = 86400000

// ---------- Venues ----------
const VENUE_DEFS: [string, string, string, number, number][] = [
  ['Sala Apolo', 'Barcelona', 'ES', 41.3745, 2.1695], ['Razzmatazz', 'Barcelona', 'ES', 41.3975, 2.1912],
  ['Sala Bóveda', 'Barcelona', 'ES', 41.4048, 2.1744], ['Palau de la Música Dummy', 'Barcelona', 'ES', 41.3875, 2.1753],
  ['La Riviera', 'Madrid', 'ES', 40.4121, -3.7211], ['Sala But', 'Madrid', 'ES', 40.4345, -3.7121],
  ['Sala Caracol', 'Madrid', 'ES', 40.4055, -3.6984], ['Teatro Barceló', 'Madrid', 'ES', 40.4283, -3.7010],
  ['Wizink Dummy Arena', 'Madrid', 'ES', 40.4237, -3.6717], ['Sala Mon', 'Madrid', 'ES', 40.4150, -3.7060],
  ['Sala Roxy', 'Valencia', 'ES', 39.4705, -0.3768], ['Loco Club', 'Valencia', 'ES', 39.4620, -0.3590],
  ['Sala Moon', 'Valencia', 'ES', 39.4690, -0.3880], ['La Cartuja Sala', 'Sevilla', 'ES', 37.4030, -6.0000],
  ['Sala X', 'Sevilla', 'ES', 37.3860, -5.9890], ['Custom Club', 'Sevilla', 'ES', 37.3790, -5.9810],
  ['Kafe Antzokia', 'Bilbao', 'ES', 43.2565, -2.9250], ['Santana 27', 'Bilbao', 'ES', 43.2610, -2.9490],
  ['Sala Azkena', 'Vitoria-Gasteiz', 'ES', 42.8467, -2.6716], ['Sala Rocksound', 'Zaragoza', 'ES', 41.6500, -0.8800],
  ['Sala López', 'Zaragoza', 'ES', 41.6488, -0.8891], ['Velvet Club', 'Málaga', 'ES', 36.7213, -4.4214],
  ['Sala París 15', 'Málaga', 'ES', 36.7150, -4.4300], ['Sala Industrial Copera', 'Granada', 'ES', 37.1773, -3.5986],
  ['Sala Mondo', 'Pamplona', 'ES', 42.8125, -1.6458], ['Sala Mardi Gras', 'Valladolid', 'ES', 41.6523, -4.7245],
  ['Sala Karma', 'Salamanca', 'ES', 40.9701, -5.6635], ['Sala Mephisto', 'A Coruña', 'ES', 43.3623, -8.4115],
  ['Sala Master Club', 'Vigo', 'ES', 42.2406, -8.7207], ['Sala Garage', 'Murcia', 'ES', 37.9922, -1.1307],
  ['Sala Trui Teatre', 'Palma', 'ES', 39.5696, 2.6502], ['Sala Moog Dummy', 'Alicante', 'ES', 38.3452, -0.4810],
  ['Sala Sonic', 'Santander', 'ES', 43.4623, -3.8099], ['Sala Gruta 77', 'Oviedo', 'ES', 43.3614, -5.8593],
  ['Paradiso Dummy', 'Ámsterdam', 'NL', 52.3622, 4.8836], ['Academy Dummy', 'Londres', 'GB', 51.4650, -0.1150],
  ['La Maroquinerie Dummy', 'París', 'FR', 48.8700, 2.3880], ['Lux Dummy', 'Lisboa', 'PT', 38.7140, -9.1240],
  ['Festivalgelände Dummy', 'Berlín', 'DE', 52.5200, 13.4050], ['Estadio Dummy', 'Ciudad de México', 'MX', 19.4326, -99.1332],
]
const venues: Venue[] = VENUE_DEFS.map(([name, city, country, lat, lon]) => ({ id: uuid(), name, city, country, lat, lon }))

// ---------- Artists ----------
const GENRES = ['Rock', 'Indie', 'Pop', 'Punk', 'Metal', 'Electrónica', 'Hip hop', 'Folk', 'Jazz', 'Latino'] as const
const A1 = ['Neón', 'Pájaros', 'Los Faroles', 'Mares', 'Cobre', 'Ceniza', 'Luz', 'Verbena', 'Hielo', 'Tormenta', 'Aurora', 'Humo', 'Sal', 'Bosque', 'Cristal', 'Marea', 'Sombra', 'Trueno', 'Lunas', 'Brasa']
const A2 = ['Mudos', 'del Norte', 'de Plata', 'Azules', 'Eléctricos', 'Perdidos', 'Salvajes', 'Lentos', 'Nocturnos', 'del Sur', 'en Llamas', 'Vacíos', 'de Hierro', 'Dormidos']
const A3 = ['Club', 'Ensemble', 'Colectivo', 'Trío', 'Sound System', 'Project']
const artistNames = new Set<string>()
while (artistNames.size < 120) {
  const n = chance(0.25) ? `${pick(A1)} ${pick(A3)}` : `${pick(A1)} ${pick(A2)}`
  artistNames.add(n)
}
const COUNTRIES = ['ES', 'ES', 'ES', 'GB', 'US', 'FR', 'SE', 'MX', 'AR', 'DE']
const artists: Artist[] = [...artistNames].map((name) => ({ id: uuid(), name, genre: pick(GENRES), country: pick(COUNTRIES) }))

// ---------- Users ----------
const FIRST = ['Alex', 'Marta', 'Jon', 'Lucía', 'Pablo', 'Irene', 'Hugo', 'Carla', 'Iker', 'Nuria', 'Dani', 'Sara', 'Álvaro', 'Elena', 'Mikel', 'Paula', 'Jordi', 'Laura', 'Adrián', 'Clara', 'Rubén', 'Ainhoa', 'Sergio', 'Noa', 'Pol', 'Eva', 'Unai', 'Berta', 'Oriol', 'Lola']
const BIOS = ['Más de lo mismo pero en directo.', 'Sala pequeña y sudor.', 'Colecciono entradas desde 2012.', 'Festivales en verano, salas el resto del año.', 'Primera fila o nada.', 'Siempre llego a los teloneros.', 'Escucho de todo menos silencio.', 'Tapones para los oídos y buena actitud.', 'Viajo por conciertos.', 'El directo siempre gana al disco.']
const CITIES = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Zaragoza', 'Málaga', 'Granada', 'Valladolid', 'Vigo']
const users: User[] = FIRST.map((f, i) => ({
  id: uuid(),
  handle: i === 0 ? 'alexdemo' : `${f.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}${int(1, 99)}`,
  displayName: i === 0 ? 'Alex Demo' : `${f} ${pick(['M.', 'R.', 'S.', 'G.', 'L.', 'P.'])}`,
  bio: i === 0 ? 'Usuario dummy del MVP. Activa Plus en Suscripción para probar Agenda e Importación.' : pick(BIOS),
  avatarUrl: null,
  city: i === 0 ? 'Madrid' : pick(CITIES),
  plus: i === 0 ? false : chance(0.3),
  createdAt: iso(todayMs - int(200, 1500) * DAY),
}))
const me = users[0]

// ---------- Gigs ----------
const gigs: Gig[] = []
const TOURS = ['Gira Aniversario', 'Tour 2026', 'Gira Despedida', 'Presentación del nuevo disco', 'Sesión especial', 'Noche de clausura']
for (let i = 0; i < 300; i++) {
  const past = i < 200
  const offset = past ? -int(1, 900) : int(0, 240)
  const venue = pick(venues)
  const festival = chance(0.08)
  const n = festival ? int(4, 6) : int(1, 3)
  const arts = sample(artists, n)
  const hour = pick([19, 20, 21, 22])
  gigs.push({
    id: uuid(),
    title: festival ? `Festival ${pick(A1)} ${pick(['Sound', 'Fest', 'Nights', 'Open Air'])}` : chance(0.3) ? `${arts[0].name} - ${pick(TOURS)}` : arts[0].name,
    date: iso(todayMs + offset * DAY + hour * 3600000),
    venueId: venue.id,
    artistIds: arts.map((a) => a.id),
    kind: festival ? 'festival' : 'concert',
  })
}
gigs.sort((a, b) => a.date.localeCompare(b.date))
const pastGigs = gigs.filter((g) => Date.parse(g.date) < todayMs)
const futureGigs = gigs.filter((g) => Date.parse(g.date) >= todayMs)

// ---------- Tags ----------
const TAG_POOL = ['festival', 'sala pequeña', 'primera vez', 'con amigos', 'acústico', 'mosh', 'mejor del año', 'repetiría', 'sold out', 'en familia', 'viaje', 'teloneros']
const tags: Tag[] = []
const tagsByUser = new Map<string, Tag[]>()
for (const u of users) {
  const mine = sample(TAG_POOL, u.id === me.id ? 8 : int(3, 6)).map((name) => ({ id: uuid(), userId: u.id, name }))
  tags.push(...mine); tagsByUser.set(u.id, mine)
}

// ---------- Attendances ----------
const REV_A = ['Directo brutal', 'Sonido flojo al principio pero remontó', 'Setlist perfecto', 'Se me hizo corto', 'Mucho mejor que en disco', 'Ambiente increíble', 'Demasiada gente para la sala', 'Teloneros sorprendentes', 'Noche mágica', 'Cumplió sin más']
const REV_B = ['la banda estuvo muy cómoda en el escenario.', 'el público cantó todo.', 'las luces ayudaron muchísimo.', 'el bis fue lo mejor de la noche.', 'me fui con los oídos pitando y feliz.', 'repetiría mañana mismo.', 'la barra tardaba una eternidad.', 'el volumen estaba algo alto.', 'salimos cantando por la calle.', 'faltó alguna canción clásica.']
const RATING_BAG = [1, 1.5, 2, 2.5, 2.5, 3, 3, 3, 3.5, 3.5, 3.5, 4, 4, 4, 4, 4.5, 4.5, 4.5, 5, 5]
const attendances: Attendance[] = []
const seenAtt = new Set<string>()
function addAtt(userId: string, gig: Gig, status: 'attended' | 'going') {
  const k = `${userId}:${gig.id}`
  if (seenAtt.has(k)) return false
  seenAtt.add(k)
  const rated = status === 'attended' && chance(0.9)
  const reviewed = rated && chance(0.55)
  const utags = tagsByUser.get(userId)!
  const gd = Date.parse(gig.date)
  attendances.push({
    id: uuid(), userId, gigId: gig.id, status,
    rating: rated ? pick(RATING_BAG) : null,
    review: reviewed ? `${pick(REV_A)}: ${pick(REV_B)}${chance(0.3) ? ' ' + pick(REV_A) + '.' : ''}` : null,
    tagIds: status === 'attended' ? sample(utags, int(0, 3)).map((t) => t.id) : [],
    createdAt: status === 'going' ? iso(todayMs - int(1, 60) * DAY - int(0, 20) * 3600000) : iso(Math.min(gd + int(1, 48) * 3600000, todayMs - 3600000)),
  })
  return true
}
// Alex (usuario dummy): bastantes asistencias y algunos "voy"
let c = 0
while (c < 45) if (addAtt(me.id, pick(pastGigs), 'attended')) c++
c = 0
while (c < 6) if (addAtt(me.id, pick(futureGigs), 'going')) c++
while (attendances.length < 440) addAtt(pick(users.slice(1)).id, pick(pastGigs), 'attended')
while (attendances.length < 500) addAtt(pick(users).id, pick(futureGigs), 'going')

// ---------- Follows ----------
const follows: Follow[] = []
const seenF = new Set<string>()
function addFollow(a: string, b: string) {
  const k = `${a}>${b}`
  if (a === b || seenF.has(k)) return
  seenF.add(k)
  follows.push({ followerId: a, followeeId: b, createdAt: iso(todayMs - int(1, 400) * DAY) })
}
for (const u of users) for (const o of sample(users.filter((x) => x.id !== u.id), int(5, 12))) addFollow(u.id, o.id)
for (const o of sample(users.slice(1), 8)) addFollow(me.id, o.id)
for (const o of sample(users.slice(1), 10)) addFollow(o.id, me.id)

// ---------- Gigslists ----------
const LIST_NAMES = ['Verano', 'Salas pequeñas', 'Festivales', 'Para ir en pareja', 'Escapadas']
const gigslists: Gigslist[] = []
for (const u of users) {
  const n = u.id === me.id ? 3 : int(1, 3)
  for (let i = 0; i < n; i++) {
    const count = u.id === me.id ? int(8, 12) : int(3, 8)
    gigslists.push({
      id: uuid(), userId: u.id, name: i === 0 ? 'Quiero ir' : LIST_NAMES[i - 1 + (u.id === me.id ? 0 : int(0, 2))] ?? LIST_NAMES[0],
      isDefault: i === 0,
      items: sample(futureGigs, count).map((g) => ({ gigId: g.id, addedAt: iso(todayMs - int(0, 30) * DAY) })),
    })
  }
}

// ---------- Activity ----------
const activities: Activity[] = []
for (const a of attendances) {
  if (a.status === 'going') {
    activities.push({ id: uuid(), userId: a.userId, type: 'going', gigId: a.gigId, targetUserId: null, rating: null, createdAt: a.createdAt })
    continue
  }
  const t0 = Date.parse(a.createdAt)
  activities.push({ id: uuid(), userId: a.userId, type: 'attended', gigId: a.gigId, targetUserId: null, rating: null, createdAt: a.createdAt })
  if (a.rating !== null) activities.push({ id: uuid(), userId: a.userId, type: 'rated', gigId: a.gigId, targetUserId: null, rating: a.rating, createdAt: iso(t0 + 60000) })
  if (a.review) activities.push({ id: uuid(), userId: a.userId, type: 'reviewed', gigId: a.gigId, targetUserId: null, rating: null, createdAt: iso(t0 + 120000) })
}
for (const l of gigslists) for (const it of l.items.slice(0, 2))
  activities.push({ id: uuid(), userId: l.userId, type: 'saved', gigId: it.gigId, targetUserId: null, rating: null, createdAt: it.addedAt })
for (const f of follows) if (chance(0.3))
  activities.push({ id: uuid(), userId: f.followerId, type: 'followed', gigId: null, targetUserId: f.followeeId, rating: null, createdAt: f.createdAt })
activities.sort((a, b) => a.createdAt.localeCompare(b.createdAt))

// ---------- ExternalRefs (placeholders para proveedores futuros) ----------
const externalRefs: ExternalRef[] = []
for (const a of artists) if (chance(0.6)) externalRefs.push({ id: uuid(), entityType: 'artist', entityId: a.id, provider: 'musicbrainz', externalId: uuid() })
for (const g of gigs) if (chance(0.4)) externalRefs.push({ id: uuid(), entityType: 'gig', entityId: g.id, provider: pick(['ticketmaster', 'setlistfm'] as const), externalId: `dummy-${int(100000, 999999)}` })
for (const v of venues) if (chance(0.5)) externalRefs.push({ id: uuid(), entityType: 'venue', entityId: v.id, provider: 'ticketmaster', externalId: `dummy-v-${int(1000, 9999)}` })

// ---------- Write ----------
const meta: SeedMeta = { generatedAt: TODAY, seed: SEED, currentUserId: me.id }
const out = join(process.cwd(), 'public', 'data')
mkdirSync(out, { recursive: true })
const files = { meta, users, artists, venues, gigs, attendances, gigslists, tags, follows, activities, externalRefs }
for (const [name, data] of Object.entries(files)) writeFileSync(join(out, `${name}.json`), JSON.stringify(data, null, 1) + '\n')
console.log(`Seed ${SEED} (${TODAY}):`, Object.fromEntries(Object.entries(files).map(([k, v]) => [k, Array.isArray(v) ? v.length : 1])))
