// Normalizacion de nombres de artista, comun al seed y a la importacion del Excel.
//
// La clave de comparacion (`key`) ignora mayusculas, tildes, puntuacion y espacios, el articulo inicial
// ("El", "La", "Los", "Las", "Lo", "The", "Les", "Els", "L'") y la conjuncion ("y", "&", "and", "i").
// Asi "Los Lagos de Hinault", "Lo Lagos de Hinault" y "Lagos de Hinault" son el mismo artista.
// Los errores de escritura que la clave no cubre se corrigen en `data/source/artist-aliases.json`
// ({ "Nombre correcto": ["Grafia erronea", ...] }), que se puede editar a mano.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ARTICLES = new Set(['el', 'la', 'los', 'las', 'lo', 'the', 'les', 'els', 'l'])
const AND = new Set(['and', 'i'])

function tokens(name) {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' y ')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
}

export function baseKey(name) {
  let t = tokens(name).map((x, i, a) => (i > 0 && i < a.length - 1 && AND.has(x) ? 'y' : x))
  while (t.length > 1 && ARTICLES.has(t[0])) t = t.slice(1)
  return t.join('')
}

export function createNormalizer(srcDir) {
  const file = join(srcDir, 'artist-aliases.json')
  const aliases = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {}
  const canonical = new Map() // clave -> nombre correcto
  for (const [good, bads] of Object.entries(aliases)) {
    canonical.set(baseKey(good), good)
    for (const b of bads) canonical.set(baseKey(b), good)
  }
  const key = (name) => {
    const c = canonical.get(baseKey(name))
    return c ? baseKey(c) : baseKey(name)
  }
  return { key, display: (name) => canonical.get(baseKey(name)) ?? name, hasAlias: (name) => canonical.has(baseKey(name)) }
}
