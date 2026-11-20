#!/usr/bin/env node
// Convierte los 3 JSON exportados de Songkick (salas, artistas, eventos) en ficheros compactos
// data/source/songkick-*.json que usa `npm run seed`.
//
//   node scripts/import-songkick.mjs <carpeta con kontz-salas.json, kontz-artistas.json, kontz-eventos.json>
//
// - Ciudades normalizadas al castellano (Seville -> Sevilla, Donostia / San Sebastián -> San Sebastián).
// - Generos de Songkick traducidos a los del catalogo de la app; sin genero -> '' (no se muestra).
// - Salas sin coordenadas: se colocan en el centro de su ciudad con un pequeno desplazamiento estable.
// - Eventos sin cartel (artist_ids vacio) o con sala desconocida se descartan.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = process.argv[2]
if (!dir) throw new Error('Uso: node scripts/import-songkick.mjs <carpeta>')
const read = (name) => JSON.parse(readFileSync(join(dir, name), 'utf8'))
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'source')
mkdirSync(OUT, { recursive: true })

const CITY = { Seville: 'Sevilla', 'Donostia / San Sebastián': 'San Sebastián' }
const city = (c) => CITY[c] ?? c
const GENRE = {
  electronic: 'Electronica', rock: 'Rock', pop: 'Pop', funk_soul: 'Soul', metal: 'Metal', country: 'Country',
  indie_alternative: 'Indie', latin: 'Latino', jazz: 'Jazz', folk_blues: 'Folk', comedy: 'Comedia',
  hip_hop: 'Hip hop', r_and_b: 'Soul', reggae: 'Reggae', classical: 'Clasica',
}
// Localidades sin ninguna sala con coordenadas (aproximadas)
const TOWN = { Eibar: [43.1849, -2.4733], Manlleu: [42.0017, 2.2848], 'Santa Maria de Palautordera': [41.6933, 2.4533], 'Miranda de Ebro': [42.6857, -2.9459] }

const salas = read('kontz-salas.json')
const artistas = read('kontz-artistas.json')
const eventos = read('kontz-eventos.json')

const sum = new Map()
for (const s of salas) if (s.lat && s.lon) { const a = sum.get(s.locality) ?? [0, 0, 0]; a[0] += s.lat; a[1] += s.lon; a[2]++; sum.set(s.locality, a) }
const hash = (str) => [...str].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

const venues = []
for (const s of salas) {
  let lat = s.lat, lng = s.lon
  if (!lat || !lng) {
    const c = sum.get(s.locality)
    const base = c ? [c[0] / c[2], c[1] / c[2]] : TOWN[s.locality]
    if (!base) continue // sala sin localizacion fiable (p. ej. un "local" inventado): se descarta
    const h = hash(s.id)
    lat = base[0] + (((h % 200) - 100) / 100) * 0.012
    lng = base[1] + ((((h >> 8) % 200) - 100) / 100) * 0.012
  }
  venues.push({ sk: s.id, name: s.name, address: s.street ?? '', city: city(s.locality), lat: +lat.toFixed(5), lng: +lng.toFixed(5) })
}
const venueIds = new Set(venues.map((v) => v.sk))

const artists = artistas.map((a) => ({ sk: a.id, name: a.name.trim(), genre: GENRE[a.genres?.[0]] ?? '' }))
const artistIds = new Set(artists.map((a) => a.sk))

const events = []
for (const e of eventos) {
  const lineup = (e.artist_ids ?? []).filter((id) => artistIds.has(id))
  if (!lineup.length || !venueIds.has(e.venue_id) || !e.date) continue
  events.push({
    sk: e.id,
    type: e.type,
    date: e.date,
    hour: e.time ? Number(e.time.slice(0, 2)) : null,
    venue: e.venue_id,
    artists: lineup,
  })
}
events.sort((a, b) => a.date.localeCompare(b.date) || a.sk.localeCompare(b.sk))

const w = (n, d) => writeFileSync(join(OUT, n), JSON.stringify(d) + '\n')
w('songkick-venues.json', venues)
w('songkick-artists.json', artists)
w('songkick-events.json', events)
console.log({ venues: venues.length, artists: artists.length, events: events.length, descartados: eventos.length - events.length })
