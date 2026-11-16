// "Base de datos" en memoria del adaptador mock. SOLO la usan los adaptadores mock.
import type {
  Activity, Artist, Attendance, ExternalRef, Follow, Gig, Gigslist, SeedMeta, Tag, User, Venue,
} from '@/domain/types'

export interface Db {
  meta: SeedMeta
  users: User[]
  artists: Artist[]
  venues: Venue[]
  gigs: Gig[]
  attendances: Attendance[]
  gigslists: Gigslist[]
  tags: Tag[]
  follows: Follow[]
  activities: Activity[]
  externalRefs: ExternalRef[]
}

const NAMES = ['users', 'artists', 'venues', 'gigs', 'attendances', 'gigslists', 'tags', 'follows', 'activities', 'externalRefs'] as const
const MUTABLE = ['users', 'attendances', 'gigslists', 'tags', 'follows', 'activities'] as const
const STORE = 'gigbox.db.v1'
const DATE_KEYS = new Set(['date', 'createdAt', 'addedAt'])
const DAY = 86400000

const dayStart = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00.000Z`)
export const todayStr = () => new Date().toISOString().slice(0, 10)

/** Desplaza todas las fechas del dataset N dias, para que sean relativas a hoy. */
function shift(node: unknown, ms: number): unknown {
  if (Array.isArray(node)) return node.map((n) => shift(n, ms))
  if (node && typeof node === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(node)) {
      out[k] = DATE_KEYS.has(k) && typeof v === 'string' ? new Date(Date.parse(v) + ms).toISOString() : shift(v, ms)
    }
    return out
  }
  return node
}

let dbPromise: Promise<Db> | null = null

async function loadJson<T>(name: string): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`)
  if (!res.ok) throw new Error(`No se pudo cargar data/${name}.json. ¿Ejecutaste "npm run seed"?`)
  return res.json() as Promise<T>
}

export function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const meta = await loadJson<SeedMeta>('meta')
      const base: Record<string, unknown> = {}
      for (const n of NAMES) base[n] = await loadJson(n)
      const days = Math.round((dayStart(todayStr()) - dayStart(meta.generatedAt)) / DAY)
      const db = shift({ ...base }, days * DAY) as Omit<Db, 'meta'>
      const full = { meta, ...db } as Db
      // Cambios del usuario guardados en localStorage (se re-desplazan a hoy).
      try {
        const raw = localStorage.getItem(STORE)
        if (raw) {
          const saved = JSON.parse(raw) as { savedOn: string; data: Pick<Db, (typeof MUTABLE)[number]> }
          const d = Math.round((dayStart(todayStr()) - dayStart(saved.savedOn)) / DAY)
          const moved = shift(saved.data, d * DAY) as typeof saved.data
          for (const k of MUTABLE) (full[k] as unknown[]) = moved[k] as unknown[]
        }
      } catch {
        localStorage.removeItem(STORE)
      }
      return full
    })()
  }
  return dbPromise
}

export function persist(db: Db) {
  const data: Record<string, unknown> = {}
  for (const k of MUTABLE) data[k] = db[k]
  localStorage.setItem(STORE, JSON.stringify({ savedOn: todayStr(), data }))
}

/** Borra los cambios locales y recarga los datos originales. */
export function resetMockData() {
  localStorage.removeItem(STORE)
  dbPromise = null
}

export function uuid(): string {
  return crypto.randomUUID()
}
