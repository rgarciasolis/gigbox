#!/usr/bin/env node
// Importa los eventos reales del Excel (exportado a JSON: [{date, venue, city, artists[]}]).
//
//   node scripts/import-excel-events.mjs [data/source/excel-events-raw.json]
//
// - Separa los artistas por "+" ("A + B", "A+ B", "A (+ B)"), limpia ruido ("18+", "...", "Ganglios +").
// - Normaliza cada artista contra la base (songkick-artists.json) sin distinguir mayusculas, tildes ni
//   puntuacion; los que no existen se crean. Duplicados con distinta grafia dentro del Excel se unifican
//   (se conserva la grafia mas frecuente).
// - Normaliza las salas contra songkick-venues.json (misma ciudad); las nuevas se crean con coordenadas
//   aproximadas (centro de la ciudad + variacion estable por nombre), porque el Excel no trae direccion.
// - Descarta eventos que ya estan en Songkick (misma fecha y sala, con algun artista en comun).
// - La clave de comparacion de artistas esta en scripts/lib/artist-key.mjs: ignora mayusculas, tildes, puntuacion,
//   espacios, articulos iniciales y "y/&/and/i"; las erratas se corrigen en data/source/artist-aliases.json.
// - Cartel limitado a MAX_LINEUP artistas por evento.
// Salida: data/source/excel-{venues,artists,events}.json y un resumen por consola.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createNormalizer } from './lib/artist-key.mjs'
import { createVenueNormalizer } from './lib/venue-key.mjs'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'data/source')
const input = process.argv[2] ?? join(SRC, 'excel-events-raw.json')
const raw = JSON.parse(readFileSync(input, 'utf8'))
const skArtists = JSON.parse(readFileSync(join(SRC, 'songkick-artists.json'), 'utf8'))
const skVenues = JSON.parse(readFileSync(join(SRC, 'songkick-venues.json'), 'utf8'))
const skEvents = JSON.parse(readFileSync(join(SRC, 'songkick-events.json'), 'utf8'))

const norm = createNormalizer(SRC)
const vn = createVenueNormalizer(SRC)
const MAX_LINEUP = 10
// Centros aproximados (lat, lng) de las ciudades del Excel; las salas nuevas se colocan cerca con una variacion estable.
const CITY_CENTER = {
  Madrid: [40.4168, -3.7038],
  Ajalvir: [40.5333, -3.4833],
  'Alcalá de Henares': [40.4818, -3.3643],
  Alcobendas: [40.5475, -3.6419],
  Aranjuez: [40.031, -3.6026],
  'Arganda del Rey': [40.3007, -3.4379],
  'Becerril de la Sierra': [40.7058, -3.9922],
  Brunete: [40.4056, -3.9996],
  'Buitrago del Lozoya': [40.9917, -3.635],
  Chapinería: [40.3794, -4.1706],
  Chinchón: [40.1408, -3.4234],
  'Colmenar de Oreja': [40.1, -3.3917],
  'Colmenar del Arroyo': [40.3969, -4.1058],
  Fuenlabrada: [40.2842, -3.7942],
  Getafe: [40.3057, -3.7329],
  Leganés: [40.3281, -3.7635],
  Loeches: [40.3689, -3.4189],
  Lozoya: [40.9611, -3.7567],
  'Manzanares el Real': [40.7297, -3.8628],
  Móstoles: [40.3223, -3.865],
  Navalcarnero: [40.2886, -4.0133],
  Pedrezuela: [40.7358, -3.6317],
  Rascafría: [40.91, -3.88],
  'Rivas-Vaciamadrid': [40.326, -3.5167],
  'San Lorenzo de El Escorial': [40.5883, -4.1481],
  'San Sebastián': [43.3183, -1.9812],
  'San Sebastián de los Reyes': [40.5476, -3.627],
  'Villanueva del Pardillo': [40.4789, -3.9663],
  'Villaviciosa de Odón': [40.3569, -3.9],
}

const key = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' y ')
    .replace(/[^a-z0-9]+/g, '')

function hash(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0) / 4294967296
}

// "(+ B)" -> " + B"; separa por "+"; limpia cada trozo
const splitArtists = (name) =>
  name
    .replace(/\(\s*\+\s*([^)]*)\)/g, ' + $1 ')
    .split('+')
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => /[\p{L}\p{N}]/u.test(p) && !/^\d+$/.test(p))

// --- 1. Artistas
const skByKey = new Map()
for (const a of skArtists) if (!skByKey.has(norm.key(a.name))) skByKey.set(norm.key(a.name), a) // la primera es la canonica
const spelling = new Map() // key -> Map(nombre -> veces)
const events = []
let split = 0
for (const e of raw) {
  const names = []
  for (const a of e.artists) {
    const parts = splitArtists(a)
    if (parts.length > 1) split++
    names.push(...parts)
  }
  const seen = new Set()
  const keys = []
  for (const n of names) {
    if (seen.size >= MAX_LINEUP) break
    const k = norm.key(n)
    if (!k || seen.has(k)) continue
    seen.add(k)
    keys.push(k)
    const m = spelling.get(k) ?? new Map()
    m.set(n, (m.get(n) ?? 0) + 1)
    spelling.set(k, m)
  }
  if (keys.length) events.push({ date: e.date, venue: e.venue.trim(), city: e.city.trim(), keys })
}
const best = (m) =>
  [...m].sort((a, b) => b[1] - a[1] || (a[0] === a[0].toUpperCase()) - (b[0] === b[0].toUpperCase()) || b[0].length - a[0].length || a[0].localeCompare(b[0]))[0][0]

const newArtists = []
const matched = new Set()
for (const [k, m] of [...spelling].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (skByKey.has(k)) matched.add(k)
  else newArtists.push({ id: `xl-artist-${newArtists.length + 1}`, name: norm.display(best(m)), genre: '', k })
}
const artistRef = new Map([...skByKey].map(([k, a]) => [k, a.sk]))
for (const a of newArtists) artistRef.set(a.k, a.id)

// --- 2. Salas: se comparan siempre dentro de la misma ciudad (ver scripts/lib/venue-key.mjs)
// El Excel pone "Madrid" en todas; data/source/venue-cities.json corrige las que estan en otro municipio.
const skVenueByKey = new Map()
for (const v of skVenues) if (!skVenueByKey.has(vn.key(v.name, v.city))) skVenueByKey.set(vn.key(v.name, v.city), v)
const venueNames = new Map() // clave -> Map(nombre -> veces)
const venueCity = new Map()
for (const e of events) {
  e.city = vn.city(e.venue, e.city)
  e.vk = vn.key(e.venue, e.city)
  const m = venueNames.get(e.vk) ?? new Map()
  m.set(e.venue, (m.get(e.venue) ?? 0) + 1)
  venueNames.set(e.vk, m)
  venueCity.set(e.vk, e.city)
}
const bestVenue = (m) =>
  [...m].sort(
    (a, b) =>
      b[1] - a[1] ||
      (a[0] === a[0].toUpperCase()) - (b[0] === b[0].toUpperCase()) ||
      /\(/.test(a[0]) - /\(/.test(b[0]) ||
      b[0].length - a[0].length ||
      a[0].localeCompare(b[0]),
  )[0][0]
const newVenues = []
const venueRef = new Map()
let venuesMatched = 0
for (const [k, m] of [...venueNames].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (skVenueByKey.has(k)) {
    venueRef.set(k, skVenueByKey.get(k).sk)
    venuesMatched++
    continue
  }
  const name = vn.display(bestVenue(m))
  const city = venueCity.get(k)
  const center = CITY_CENTER[city]
  if (!center) throw new Error(`Falta el centro de la ciudad "${city}" en CITY_CENTER (sala "${name}")`)
  const [lat, lng] = center
  const spread = city === 'Madrid' ? [0.07, 0.09] : [0.008, 0.01]
  const id = `xl-venue-${newVenues.length + 1}`
  newVenues.push({
    id,
    name,
    address: '',
    city,
    lat: Number((lat + (hash(k + 'a') - 0.5) * spread[0]).toFixed(5)),
    lng: Number((lng + (hash(k + 'b') - 0.5) * spread[1]).toFixed(5)),
  })
  venueRef.set(k, id)
}

// --- 3. Eventos (sin los que ya estan en Songkick)
const skDup = new Map()
for (const e of skEvents) {
  const v = skVenues.find((x) => x.sk === e.venue)
  if (!v) continue
  const k = `${e.date}|${vn.key(v.name, v.city)}`
  skDup.set(k, new Set([...(skDup.get(k) ?? []), ...e.artists]))
}
let dups = 0
const outEvents = []
for (const e of events) {
  const sk = skDup.get(`${e.date}|${e.vk}`)
  const refs = e.keys.map((k) => artistRef.get(k))
  if (sk && refs.some((r) => sk.has(r))) {
    dups++
    continue
  }
  outEvents.push({ date: e.date, venue: venueRef.get(e.vk), artists: refs })
}
outEvents.sort((a, b) => a.date.localeCompare(b.date))

writeFileSync(join(SRC, 'excel-artists.json'), JSON.stringify(newArtists.map(({ k, ...a }) => a)))
writeFileSync(join(SRC, 'excel-venues.json'), JSON.stringify(newVenues))
writeFileSync(join(SRC, 'excel-events.json'), JSON.stringify(outEvents))

console.log(`Eventos del Excel: ${raw.length} | importados: ${outEvents.length} | ya en Songkick: ${dups} | sin artista: ${raw.length - events.length}`)
console.log(`Entradas con "+" separadas: ${split}`)
console.log(`Artistas distintos: ${spelling.size} | ya en la BBDD: ${matched.size} | nuevos: ${newArtists.length}`)
console.log(`Salas distintas: ${venueNames.size} | ya en la BBDD: ${venuesMatched} | nuevas: ${newVenues.length}`)
