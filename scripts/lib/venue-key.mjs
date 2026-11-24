// Normalizacion de salas, comun al seed y a la importacion del Excel. SIEMPRE se compara dentro de la misma ciudad.
//
// La clave ignora mayusculas, tildes, puntuacion, espacios, el contenido entre parentesis, la palabra "Madrid" y
// las palabras genericas ("Sala", "Club", "Teatro", "Auditorio", "Cafe", "Bar", "Centro cultural", articulos...).
// Asi "Sala But", "But" y "Sala But (Madrid)" son la misma sala. Dos ficheros editables a mano corrigen lo demas:
//   data/source/venue-aliases.json  { "Nombre correcto": ["Grafia o nombre equivalente", ...], "_separate": ["Nombre", ...] }
//                                   "_separate": nombres que NO deben unirse con otros aunque la clave coincida.
//   data/source/venue-cities.json   { "Nombre exacto de la sala": "Ciudad" }  (el Excel pone "Madrid" en todas)

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const GENERIC = new Set(['sala', 'club', 'teatro', 'auditorio', 'cafe', 'cafeteria', 'bar', 'pub', 'la', 'el', 'los', 'las', 'de', 'del', 'the', 'centro', 'cultural', 'madrid'])

const tokens = (s) =>
  s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/&/g, ' y ').split(/[^\p{L}\p{N}]+/u).filter(Boolean)
const full = (name) => tokens(name).join('')
const stripped = (name) => {
  const t = tokens(name.replace(/\([^)]*\)/g, ' '))
  const core = t.filter((x) => !GENERIC.has(x))
  return (core.length ? core : t).join('')
}
export const cityKey = (city) => tokens(city).join('')

const read = (file, fallback) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback)

export function createVenueNormalizer(srcDir) {
  const aliases = read(join(srcDir, 'venue-aliases.json'), {})
  const cities = read(join(srcDir, 'venue-cities.json'), {})
  const separate = new Set((aliases._separate ?? []).map(full))
  const canonical = new Map() // clave completa -> nombre correcto
  for (const [good, bads] of Object.entries(aliases)) {
    if (good === '_separate') continue
    canonical.set(full(good), good)
    for (const b of bads) canonical.set(full(b), good)
  }
  const cityOf = new Map(Object.entries(cities).map(([n, c]) => [full(n), c]))
  const keyOf = (name) => {
    const c = canonical.get(full(name))
    if (c) return `A:${full(c)}`
    if (separate.has(full(name))) return `S:${full(name)}`
    return stripped(name)
  }
  return {
    /** Clave de sala: ciudad + nombre normalizado. */
    key: (name, city) => `${cityKey(cityOf.get(full(name)) ?? city)}|${keyOf(name)}`,
    city: (name, city) => cityOf.get(full(name)) ?? city,
    display: (name) => canonical.get(full(name)) ?? name,
  }
}
