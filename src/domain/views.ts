// Tipos "compuestos" que devuelven los repositorios para que las pantallas no hagan joins.
import type { Activity, Artist, Attendance, Gig, Gigslist, Tag, User, UUID, Venue } from './types'

export interface GigView {
  gig: Gig
  artists: Artist[]
  venue: Venue
  avgRating: number | null
  ratingCount: number
  reviewCount: number
  /** Mi asistencia a este gig, si existe. */
  mine: Attendance | null
  isUpcoming: boolean
}

export interface ReviewView {
  attendance: Attendance
  user: User
  gig: GigView
}

export interface GigDetail extends GigView {
  friendsAttended: User[]
  friendsGoing: User[]
  reviews: ReviewView[]
  inGigslistIds: UUID[]
}

export interface AttendanceView {
  attendance: Attendance
  gig: GigView
  tags: Tag[]
}

export interface GigFilter {
  q?: string
  scope?: 'all' | 'past' | 'upcoming'
  city?: string
  genre?: string
  /** Solo gigs a los que fui / voy yo. */
  onlyMine?: boolean
  tagId?: UUID
  sort?: 'date-desc' | 'date-asc'
}

export interface GigFilterOptions {
  cities: string[]
  genres: string[]
}

export interface ProfileStats {
  gigs: number
  artists: number
  venues: number
  cities: number
}

export interface ActivityView {
  activity: Activity
  user: User
  gig: GigView | null
  targetUser: User | null
}

export interface ProfileView {
  user: User
  stats: ProfileStats
  favorites: AttendanceView[]
  recentActivity: ActivityView[]
  followers: number
  following: number
  isMe: boolean
  isFollowing: boolean
  /** Amigos con los que hay gigs en comun (solo perfil ajeno). */
  sharedGigs: number
}

export interface TagWithCount {
  tag: Tag
  count: number
}

export interface GigslistView {
  gigslist: Gigslist
  items: { gig: GigView; addedAt: string }[]
}

export interface UpcomingSaved {
  gig: GigView
  gigslistNames: string[]
}

export interface AgendaQuery {
  radiusKm: number | null
  from?: string
  to?: string
  genre?: string
  /** Si true, solo gigs de artistas que ya he visto. */
  onlyMyArtists?: boolean
}

export interface AgendaItem {
  gig: GigView
  reason: 'artist' | 'city' | 'both'
  distanceKm: number | null
  matchedArtists: string[]
}

export interface ImportCandidate {
  id: string
  /** Fragmento del email del que sale la deteccion. */
  snippet: string
  artistName: string
  venueName: string
  date: string
  /** Gig del catalogo que encaja, si se encontro. */
  matchedGigId: UUID | null
  /** Ya tengo una asistencia a ese gig. */
  duplicateOfAttendanceId: UUID | null
  confidence: number
}

export interface ImportResult {
  candidates: ImportCandidate[]
}

export interface ImportConfirmation {
  candidates: ImportCandidate[]
}
