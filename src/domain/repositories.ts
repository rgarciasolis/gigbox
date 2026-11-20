// Interfaces de la capa de datos. Las pantallas NUNCA acceden a los datos directamente:
// pasan por hooks (src/queries) que llaman a estas interfaces.
// Hoy las implementa src/data/mock. En la fase real se implementan contra Supabase y APIs.

import type {
  Artist,
  ContactWishlistAdd,
  Attendance,
  AttendanceView,
  GigDetail,
  GigFacets,
  GigFilters,
  GigSummary,
  Gigslist,
  HomeFeed,
  ID,
  ListDetail,
  NotificationSettings,
  NotificationTab,
  NotificationView,
  ProfileView,
  ReviewView,
  StatsView,
  SubscriptionState,
  Tag,
  TicketStatus,
  User,
  UserSummary,
  Venue,
  WishlistEntry,
} from './types'

export interface GigRepository {
  search(filters: GigFilters): Promise<GigSummary[]>
  getById(id: ID): Promise<GigDetail>
  getFacets(): Promise<GigFacets>
  searchArtists(query: string): Promise<Artist[]>
  getVenue(id: ID): Promise<{ venue: Venue; upcoming: GigSummary[]; past: GigSummary[] }>
  setLike(gigId: ID, liked: boolean): Promise<void>
}

export interface AttendanceUpdate {
  rating?: number | null
  review?: string | null
  tagIds?: ID[]
  photoUrl?: string | null
}

export interface AttendanceRepository {
  markAttended(gigId: ID): Promise<Attendance>
  unmarkAttended(gigId: ID): Promise<void>
  update(gigId: ID, patch: AttendanceUpdate): Promise<Attendance>
  listMine(filters?: { tagId?: ID }): Promise<AttendanceView[]>
  listReviews(scope: 'mine' | 'friends'): Promise<ReviewView[]>
  deleteReview(gigId: ID): Promise<void>
  toggleReviewLike(attendanceId: ID, liked: boolean): Promise<void>
}

export interface GigslistRepository {
  getWishlist(): Promise<WishlistEntry[]>
  addToWishlist(gigId: ID): Promise<void>
  removeFromWishlist(gigId: ID): Promise<void>
  setTicketStatus(gigId: ID, status: TicketStatus): Promise<void>
  listLists(): Promise<Gigslist[]>
  getList(id: ID): Promise<ListDetail>
  createList(input: { title: string; description?: string | null }): Promise<Gigslist>
  updateList(id: ID, patch: { title?: string; description?: string | null }): Promise<Gigslist>
  deleteList(id: ID): Promise<void>
  addToList(listId: ID, gigId: ID): Promise<void>
  removeFromList(listId: ID, gigId: ID): Promise<void>
}

export interface ProfileRepository {
  getCurrentUser(): Promise<User>
  getProfile(userId: ID): Promise<ProfileView>
  updateProfile(patch: { displayName?: string; bio?: string; city?: string }): Promise<User>
  setFavorites(gigIds: ID[]): Promise<void>
  getFavoriteIds(): Promise<ID[]>
  getStats(): Promise<StatsView>
  getSubscription(): Promise<SubscriptionState>
  setPlus(plus: boolean): Promise<SubscriptionState>
}

export interface FriendRepository {
  follow(userId: ID): Promise<void>
  unfollow(userId: ID): Promise<void>
  listFollowing(userId: ID): Promise<UserSummary[]>
  listFollowers(userId: ID): Promise<UserSummary[]>
  searchUsers(query: string): Promise<UserSummary[]>
}

export interface TagRepository {
  list(): Promise<(Tag & { count: number })[]>
  create(name: string): Promise<Tag>
  rename(id: ID, name: string): Promise<Tag>
  remove(id: ID): Promise<void>
}

export interface ArtistFollowRepository {
  listMine(): Promise<Artist[]>
  getFollowedIds(): Promise<ID[]>
  follow(artistId: ID): Promise<void>
  unfollow(artistId: ID): Promise<void>
}

export interface NotificationRepository {
  list(tab: NotificationTab): Promise<NotificationView[]>
  /** Interacciones sin leer y, solo con Plus, avisos de artistas sin leer (dentro del radio). La campana solo usa si es > 0. */
  unreadCount(): Promise<number>
  markRead(id: ID): Promise<void>
  markAllRead(tab: NotificationTab): Promise<void>
  getSettings(): Promise<NotificationSettings>
  setRadius(radiusKm: number): Promise<NotificationSettings>
}

export interface FeedRepository {
  /** Lista completa (Ver mas) de conciertos anadidos a la Wishlist por los contactos. */
  listContactWishlistAdds(): Promise<ContactWishlistAdd[]>
  /** Lista completa (Ver mas) de resenas de los contactos. */
  listContactReviews(): Promise<ReviewView[]>
  getHome(): Promise<HomeFeed>
}

export interface Repositories {
  gigs: GigRepository
  attendances: AttendanceRepository
  gigslists: GigslistRepository
  profiles: ProfileRepository
  friends: FriendRepository
  tags: TagRepository
  artistFollows: ArtistFollowRepository
  notifications: NotificationRepository
  feed: FeedRepository
}
