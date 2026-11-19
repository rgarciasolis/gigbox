// Modelo de dominio. Replica el esquema final (Postgres): ver docs/DATA_MODEL.md.
// Los IDs son UUID (string). Las fechas son ISO 8601 (string).

export type ID = string
export type ISODate = string

export interface User {
  id: ID
  username: string
  displayName: string
  bio: string
  city: string
  createdAt: ISODate
}

export interface Artist {
  id: ID
  name: string
  genre: string
}

export interface Venue {
  id: ID
  name: string
  address: string
  city: string
  country: string
  lat: number
  lng: number
}

export interface Gig {
  id: ID
  artistIds: ID[] // cartel: el primero es cabeza de cartel
  venueId: ID
  startsAt: ISODate
  imageUrl: string | null
  createdAt: ISODate // cuando se anadio al catalogo
}

/** Asistencia de un usuario a un concierto pasado (Fui), con nota, resena, tags y foto. */
export interface Attendance {
  id: ID
  userId: ID
  gigId: ID
  rating: number | null // 0.5 a 5, pasos de 0.5
  review: string | null
  tagIds: ID[]
  photoUrl: string | null
  createdAt: ISODate
}

export type TicketStatus = 'no_ticket' | 'has_ticket'
export type GigslistKind = 'wishlist' | 'custom'

export interface GigslistItem {
  gigId: ID
  addedAt: ISODate
  ticketStatus: TicketStatus // solo tiene sentido en la wishlist
}

/** Lista de conciertos. kind 'wishlist' es la lista unica de futuros; 'custom' son las listas personales. */
export interface Gigslist {
  id: ID
  userId: ID
  kind: GigslistKind
  title: string
  description: string | null
  items: GigslistItem[]
}

export interface Tag {
  id: ID
  userId: ID
  name: string
}

export interface Follow {
  followerId: ID
  followeeId: ID
  createdAt: ISODate
}

export type ActivityType = 'wishlist_add' | 'review' | 'attended'

export interface Activity {
  id: ID
  userId: ID
  type: ActivityType
  gigId: ID
  attendanceId: ID | null
  createdAt: ISODate
}

export interface GigLike {
  userId: ID
  gigId: ID
}

export interface ReviewLike {
  userId: ID
  attendanceId: ID
}

/** Un usuario sigue a un artista (gratis). Alimenta los avisos de la pestana Artistas (Plus). */
export interface ArtistFollow {
  userId: ID
  artistId: ID
  createdAt: ISODate
}

export type NotificationType = 'artist_gig_announced' | 'review_like' | 'new_follower'

/** Aviso del buzon. Los de like y seguidor se generan en servidor (triggers), no desde el cliente. */
export interface Notification {
  id: ID
  userId: ID // destinatario
  type: NotificationType
  createdAt: ISODate
  read: boolean
  actorId: ID | null // quien hizo el like o el follow
  gigId: ID | null
  artistId: ID | null
  attendanceId: ID | null
}

export interface ExternalRef {
  id: ID
  entityType: 'artist' | 'venue' | 'gig'
  entityId: ID
  provider: 'musicbrainz' | 'ticketmaster' | 'setlistfm' | 'songkick' | 'bandsintown'
  externalId: string
}

// ---------------------------------------------------------------------------
// Vistas compuestas (lo que devuelven los repositorios a las pantallas)
// ---------------------------------------------------------------------------

export interface GigSummary {
  gig: Gig
  artists: Artist[]
  venue: Venue
  avgRating: number | null
  attendeeCount: number
  isPast: boolean
  likedByMe: boolean
  inMyWishlist: boolean
  attendedByMe: boolean
}

export interface ReviewView {
  attendance: Attendance
  user: User
  gig: GigSummary
  likeCount: number
  likedByMe: boolean
}

export interface ContactActivityEntry {
  user: User
  kind: 'attended' | 'going'
}

export interface GigDetail extends GigSummary {
  myAttendance: Attendance | null
  myTicketStatus: TicketStatus | null
  myListIds: ID[]
  reviews: ReviewView[]
  contacts: ContactActivityEntry[] // amigos que fueron o van
}

export interface WishlistEntry {
  item: GigslistItem
  gig: GigSummary
}

export interface ListDetail {
  list: Gigslist
  entries: WishlistEntry[]
  owner: User
}

export interface AttendanceView {
  attendance: Attendance
  gig: GigSummary
  tags: Tag[]
  liked: boolean
}

export interface ProfileStats {
  concertsTotal: number
  concertsThisYear: number
  artists: number
  venues: number
  cities: number
  following: number
  followers: number
}

export interface ActivityView {
  activity: Activity
  user: User
  gig: GigSummary
  review: Attendance | null
}

export interface ProfileView {
  user: User
  stats: ProfileStats
  favorites: GigSummary[]
  latest: GigSummary[]
  recentActivity: ActivityView[]
  isMe: boolean
  isFollowing: boolean
}

export interface UserSummary {
  user: User
  isFollowing: boolean
  concertsTotal: number
}

export interface StatsView {
  byYear: { year: number; count: number }[]
  topArtists: { artist: Artist; count: number }[]
  topVenues: { venue: Venue; count: number }[]
  topCities: { city: string; count: number }[]
  topGenres: { genre: string; count: number }[]
  avgRating: number | null
}

export interface SubscriptionState {
  plus: boolean
}

export interface NotificationView {
  notification: Notification
  actor: User | null
  gig: GigSummary | null
  artist: Artist | null
}

export type NotificationTab = 'artists' | 'interactions'

export interface NotificationSettings {
  radiusKm: number
}

/** Radios disponibles para los avisos de artistas (km) y valor por defecto. */
export const NOTIFICATION_RADIUS_OPTIONS = [25, 50, 100, 200, 500] as const
export const DEFAULT_NOTIFICATION_RADIUS_KM = 50

// ---------------------------------------------------------------------------
// Filtros y parametros
// ---------------------------------------------------------------------------

export type TimeScope = 'all' | 'future' | 'past'

export interface GigFilters {
  artistId?: ID
  artistQuery?: string
  city?: string
  venueId?: ID
  genre?: string
  dateFrom?: string // YYYY-MM-DD
  dateTo?: string // YYYY-MM-DD
  scope: TimeScope
}

export interface GigFacets {
  cities: string[]
  genres: string[]
  venues: Venue[]
}

export type HomeFeed =
  | {
      mode: 'contacts'
      wishlistAdds: { user: User; gig: GigSummary; addedAt: ISODate }[]
      reviews: ReviewView[]
    }
  | {
      mode: 'city'
      city: string
      latestInCity: GigSummary[]
      wishlistOfCity: (GigSummary & { saves: number })[]
    }
