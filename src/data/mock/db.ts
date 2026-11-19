// "Base de datos" en memoria del adaptador mock.
// - Datos estaticos (usuarios, artistas, salas, conciertos): se cargan de /data/*.json.
// - Datos mutables (asistencias, listas, follows...): se copian a memoria y se persisten en
//   localStorage para que los cambios sobrevivan a recargar la pagina.
// Las fechas del JSON son relativas a hoy y se convierten aqui a fechas ISO reales.

import usersRaw from '../../../data/users.json'
import artistsRaw from '../../../data/artists.json'
import venuesRaw from '../../../data/venues.json'
import gigsRaw from '../../../data/gigs.json'
import attendancesRaw from '../../../data/attendances.json'
import tagsRaw from '../../../data/tags.json'
import gigslistsRaw from '../../../data/gigslists.json'
import followsRaw from '../../../data/follows.json'
import activitiesRaw from '../../../data/activities.json'
import gigLikesRaw from '../../../data/gigLikes.json'
import reviewLikesRaw from '../../../data/reviewLikes.json'
import favoritesRaw from '../../../data/favorites.json'
import metaRaw from '../../../data/meta.json'

import type {
  Activity,
  Artist,
  Attendance,
  Follow,
  Gig,
  GigLike,
  Gigslist,
  ID,
  ReviewLike,
  Tag,
  User,
  Venue,
} from '@/domain/types'

const STORAGE_KEY = 'concis.mock.state.v1'
const NOW = Date.now()

const minToIso = (min: number) => new Date(NOW + min * 60_000).toISOString()
function dayToIso(dayOffset: number, hour: number) {
  const d = new Date(NOW)
  d.setHours(hour, 0, 0, 0)
  d.setDate(d.getDate() + dayOffset)
  return d.toISOString()
}

// ---- Tipos "raw" (forma de los JSON)
interface RawUser extends Omit<User, 'createdAt'> {
  createdDayOffset: number
}
interface RawGig extends Omit<Gig, 'startsAt' | 'createdAt'> {
  dayOffset: number
  hour: number
  createdMinOffset: number
}
interface RawAttendance extends Omit<Attendance, 'createdAt'> {
  createdMinOffset: number
}
interface RawGigslist extends Omit<Gigslist, 'items'> {
  items: { gigId: ID; addedMinOffset: number; ticketStatus: 'no_ticket' | 'has_ticket' }[]
}
interface RawFollow extends Omit<Follow, 'createdAt'> {
  createdMinOffset: number
}
interface RawActivity extends Omit<Activity, 'createdAt'> {
  createdMinOffset: number
}

// ---- Datos estaticos
export const ME_ID: ID = (metaRaw as { currentUserId: ID }).currentUserId

export const users: User[] = (usersRaw as unknown as RawUser[]).map(({ createdDayOffset, ...u }) => ({
  ...u,
  createdAt: dayToIso(createdDayOffset, 12),
}))
export const artists = artistsRaw as unknown as Artist[]
export const venues = venuesRaw as unknown as Venue[]
export const gigs: Gig[] = (gigsRaw as unknown as RawGig[]).map(
  ({ dayOffset, hour, createdMinOffset, ...g }) => ({
    ...g,
    startsAt: dayToIso(dayOffset, hour),
    createdAt: minToIso(createdMinOffset),
  }),
)

export const userById = new Map(users.map((u) => [u.id, u]))
export const artistById = new Map(artists.map((a) => [a.id, a]))
export const venueById = new Map(venues.map((v) => [v.id, v]))
export const gigById = new Map(gigs.map((g) => [g.id, g]))

// ---- Datos mutables
export interface MockState {
  version: 1
  attendances: Attendance[]
  gigslists: Gigslist[]
  follows: Follow[]
  tags: Tag[]
  activities: Activity[]
  gigLikes: GigLike[]
  reviewLikes: ReviewLike[]
  favorites: Record<ID, ID[]>
  mePatch: Partial<User>
  plus: boolean
}

function initialState(): MockState {
  const plusDefault = import.meta.env.VITE_FLAG_PLUS_DEFAULT === 'true'
  return {
    version: 1,
    attendances: (attendancesRaw as unknown as RawAttendance[]).map(({ createdMinOffset, ...a }) => ({
      ...a,
      createdAt: minToIso(createdMinOffset),
    })),
    gigslists: (gigslistsRaw as unknown as RawGigslist[]).map((l) => ({
      ...l,
      items: l.items.map(({ addedMinOffset, ...i }) => ({ ...i, addedAt: minToIso(addedMinOffset) })),
    })),
    follows: (followsRaw as unknown as RawFollow[]).map(({ createdMinOffset, ...f }) => ({
      ...f,
      createdAt: minToIso(createdMinOffset),
    })),
    tags: tagsRaw as unknown as Tag[],
    activities: (activitiesRaw as unknown as RawActivity[]).map(({ createdMinOffset, ...a }) => ({
      ...a,
      createdAt: minToIso(createdMinOffset),
    })),
    gigLikes: gigLikesRaw as unknown as GigLike[],
    reviewLikes: reviewLikesRaw as unknown as ReviewLike[],
    favorites: Object.fromEntries(
      (favoritesRaw as unknown as { userId: ID; gigIds: ID[] }[]).map((f) => [f.userId, f.gigIds]),
    ),
    mePatch: {},
    plus: plusDefault,
  }
}

function loadState(): MockState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as MockState
      if (parsed.version === 1) return parsed
    }
  } catch {
    // estado corrupto o localStorage no disponible: se parte de los datos del seed
  }
  return initialState()
}

export const state: MockState = loadState()

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignorar
  }
}

/** Borra los cambios guardados y vuelve a los datos del seed (recarga la pagina). */
export function resetMockState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignorar
  }
  window.location.reload()
}

export const newId = () => crypto.randomUUID()
export const nowIso = () => new Date().toISOString()
