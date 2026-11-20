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
import artistFollowsRaw from '../../../data/artistFollows.json'
import notificationsRaw from '../../../data/notifications.json'
import metaRaw from '../../../data/meta.json'

import { DEFAULT_NOTIFICATION_RADIUS_KM } from '@/domain/types'
import type {
  Activity,
  Artist,
  ArtistFollow,
  Attendance,
  Follow,
  Gig,
  GigLike,
  Gigslist,
  ID,
  Notification,
  ReviewLike,
  Tag,
  User,
  Venue,
} from '@/domain/types'

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
interface RawArtistFollow extends Omit<ArtistFollow, 'createdAt'> {
  createdMinOffset: number
}
interface RawNotification extends Omit<Notification, 'createdAt'> {
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

// La clave incluye una huella de los datos del seed: si se regeneran (npm run seed, artistas nuevos...),
// el estado guardado en el navegador referencia ids que ya no existen y rompe la app. Con otra clave se descarta solo.
const DATA_SIG = `${gigs.length}.${artists.length}.${venues.length}.${gigs[0]?.id ?? ''}.${artists[0]?.id ?? ''}`
const STORAGE_KEY = `concis.mock.state.v1.${[...DATA_SIG].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36)}`

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
  artistFollows: ArtistFollow[]
  notifications: Notification[]
  radiusKm: number
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
    artistFollows: (artistFollowsRaw as unknown as RawArtistFollow[]).map(({ createdMinOffset, ...f }) => ({
      ...f,
      createdAt: minToIso(createdMinOffset),
    })),
    notifications: (notificationsRaw as unknown as RawNotification[]).map(({ createdMinOffset, ...n }) => ({
      ...n,
      createdAt: minToIso(createdMinOffset),
    })),
    radiusKm: DEFAULT_NOTIFICATION_RADIUS_KM,
    mePatch: {},
    plus: plusDefault,
  }
}

function loadState(): MockState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as MockState
      // Se completa con los datos iniciales por si el estado guardado es anterior a los avisos
      if (parsed.version === 1) return { ...initialState(), ...parsed }
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
