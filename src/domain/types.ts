// Modelo de dominio. Replica el esquema Postgres final (ver docs/DATA_MODEL.md).
// Todos los ids son UUID (string). Todas las fechas son ISO 8601 (UTC).

export type UUID = string
export type ISODate = string

export interface User {
  id: UUID
  handle: string
  displayName: string
  bio: string
  avatarUrl: string | null
  city: string
  /** Plan Plus (Agenda e Importacion masiva). */
  plus: boolean
  createdAt: ISODate
}

export interface Artist {
  id: UUID
  name: string
  genre: string
  country: string
}

export interface Venue {
  id: UUID
  name: string
  city: string
  country: string
  lat: number
  lon: number
}

export interface Gig {
  id: UUID
  title: string
  date: ISODate
  venueId: UUID
  /** Cabeza de cartel primero. */
  artistIds: UUID[]
  /** Festival, gira, etc. */
  kind: 'concert' | 'festival'
}

export type AttendanceStatus = 'attended' | 'going'

export interface Attendance {
  id: UUID
  userId: UUID
  gigId: UUID
  status: AttendanceStatus
  /** 0.5 a 5 en pasos de 0.5. null = sin puntuar. */
  rating: number | null
  review: string | null
  tagIds: UUID[]
  createdAt: ISODate
}

export interface GigslistItem {
  gigId: UUID
  addedAt: ISODate
}

export interface Gigslist {
  id: UUID
  userId: UUID
  name: string
  isDefault: boolean
  items: GigslistItem[]
}

export interface Tag {
  id: UUID
  userId: UUID
  name: string
}

export interface Follow {
  followerId: UUID
  followeeId: UUID
  createdAt: ISODate
}

export type ActivityType = 'attended' | 'rated' | 'reviewed' | 'saved' | 'followed' | 'going'

export interface Activity {
  id: UUID
  userId: UUID
  type: ActivityType
  gigId: UUID | null
  targetUserId: UUID | null
  /** Para 'rated': la nota. */
  rating: number | null
  createdAt: ISODate
}

export type ExternalEntityType = 'artist' | 'venue' | 'gig'
export type ExternalProvider = 'ticketmaster' | 'setlistfm' | 'musicbrainz' | 'songkick' | 'bandsintown'

export interface ExternalRef {
  id: UUID
  entityType: ExternalEntityType
  entityId: UUID
  provider: ExternalProvider
  externalId: string
}

export interface SeedMeta {
  generatedAt: string // YYYY-MM-DD, referencia para fechas relativas
  seed: number
  currentUserId: UUID
}
