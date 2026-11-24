// Conjuntos de datos del adaptador mock. Cada uno vive en /data/<nombre>/*.json (los genera `npm run seed`)
// y se carga bajo demanda: solo se descarga el elegido, en trozos separados del codigo de la app.
//   reales: salas, artistas y conciertos reales (Songkick y Excel); usuarios, resenas y demas, ficticios.
//   dummy:  todo inventado (con la lista curada de artistas), un conjunto pequeño.

export type DatasetName = 'reales' | 'dummy'

export const DATASETS: { value: DatasetName; label: string; hint: string }[] = [
  { value: 'reales', label: 'Reales', hint: 'Conciertos, salas y artistas reales (Songkick y Excel)' },
  { value: 'dummy', label: 'Dummy', hint: 'Datos inventados, un conjunto pequeño' },
]

const KEY = 'concis.dataset'

export function getDataset(): DatasetName {
  try {
    return localStorage.getItem(KEY) === 'dummy' ? 'dummy' : 'reales'
  } catch {
    return 'reales'
  }
}

/** Guarda la eleccion y recarga: los datos se cargan una sola vez al arrancar. */
export function setDataset(name: DatasetName) {
  try {
    localStorage.setItem(KEY, name)
  } catch {
    /* sin almacenamiento: se queda el conjunto por defecto */
  }
  location.reload()
}

export const DATASET: DatasetName = getDataset()

const FILES = [
  'users', 'artists', 'venues', 'gigs', 'attendances', 'tags', 'gigslists', 'follows',
  'activities', 'gigLikes', 'reviewLikes', 'favorites', 'artistFollows', 'notifications', 'meta',
] as const
type FileName = (typeof FILES)[number]

// Un trozo (chunk) por fichero; no se descargan hasta que se llama a loadDataset.
const loaders = import.meta.glob(['../../../data/{reales,dummy}/*.json', '!**/externalRefs.json'], { import: 'default' })

export async function loadDataset(name: DatasetName): Promise<Record<FileName, unknown>> {
  const entries = await Promise.all(
    FILES.map(async (f) => [f, await loaders[`../../../data/${name}/${f}.json`]()] as const),
  )
  return Object.fromEntries(entries) as Record<FileName, unknown>
}
