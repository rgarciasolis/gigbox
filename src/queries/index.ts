// Hooks de datos (TanStack Query). Es la UNICA capa que las pantallas usan para leer o escribir.
// Cada hook llama a un repositorio (src/domain/repositories.ts); no sabe si es mock o real.

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRepositories } from '@/data'
import type { AttendanceUpdate } from '@/domain/repositories'
import type { GigFilters, ID, NotificationTab, TicketStatus } from '@/domain/types'

// ---------------------------------------------------------------- Lecturas

export function useHomeFeed() {
  const { feed } = useRepositories()
  return useQuery({ queryKey: ['home'], queryFn: () => feed.getHome() })
}

export function useGigSearch(filters: GigFilters) {
  const { gigs } = useRepositories()
  return useQuery({
    queryKey: ['gigs', 'search', filters],
    queryFn: () => gigs.search(filters),
    placeholderData: keepPreviousData,
  })
}

export function useGig(id: ID) {
  const { gigs } = useRepositories()
  return useQuery({ queryKey: ['gigs', 'detail', id], queryFn: () => gigs.getById(id) })
}

export function useFacets() {
  const { gigs } = useRepositories()
  return useQuery({ queryKey: ['facets'], queryFn: () => gigs.getFacets(), staleTime: Infinity })
}

export function useArtistSearch(query: string) {
  const { gigs } = useRepositories()
  return useQuery({
    queryKey: ['artists', query],
    queryFn: () => gigs.searchArtists(query),
    enabled: query.trim().length > 0,
  })
}

export function useVenue(id: ID) {
  const { gigs } = useRepositories()
  return useQuery({ queryKey: ['venue', id], queryFn: () => gigs.getVenue(id) })
}

export function useMyAttendances(tagId?: ID) {
  const { attendances } = useRepositories()
  return useQuery({
    queryKey: ['attendances', 'mine', tagId ?? null],
    queryFn: () => attendances.listMine({ tagId }),
  })
}

export function useReviews(scope: 'mine' | 'friends') {
  const { attendances } = useRepositories()
  return useQuery({ queryKey: ['reviews', scope], queryFn: () => attendances.listReviews(scope) })
}

export function useWishlist() {
  const { gigslists } = useRepositories()
  return useQuery({ queryKey: ['wishlist'], queryFn: () => gigslists.getWishlist() })
}

export function useLists() {
  const { gigslists } = useRepositories()
  return useQuery({ queryKey: ['lists'], queryFn: () => gigslists.listLists() })
}

export function useList(id: ID) {
  const { gigslists } = useRepositories()
  return useQuery({ queryKey: ['lists', id], queryFn: () => gigslists.getList(id) })
}

export function useProfile(userId: ID) {
  const { profiles } = useRepositories()
  return useQuery({ queryKey: ['profile', userId], queryFn: () => profiles.getProfile(userId) })
}

export function useCurrentUser() {
  const { profiles } = useRepositories()
  return useQuery({ queryKey: ['me'], queryFn: () => profiles.getCurrentUser() })
}

export function useFavoriteIds() {
  const { profiles } = useRepositories()
  return useQuery({ queryKey: ['favorites'], queryFn: () => profiles.getFavoriteIds() })
}

export function useStats() {
  const { profiles } = useRepositories()
  return useQuery({ queryKey: ['stats'], queryFn: () => profiles.getStats() })
}

export function useSubscription() {
  const { profiles } = useRepositories()
  return useQuery({ queryKey: ['subscription'], queryFn: () => profiles.getSubscription() })
}

export function useFollowing(userId: ID) {
  const { friends } = useRepositories()
  return useQuery({ queryKey: ['following', userId], queryFn: () => friends.listFollowing(userId) })
}

export function useFollowers(userId: ID) {
  const { friends } = useRepositories()
  return useQuery({ queryKey: ['followers', userId], queryFn: () => friends.listFollowers(userId) })
}

export function useSearchUsers(query: string) {
  const { friends } = useRepositories()
  return useQuery({
    queryKey: ['users', 'search', query],
    queryFn: () => friends.searchUsers(query),
    placeholderData: keepPreviousData,
  })
}

export function useTags() {
  const { tags } = useRepositories()
  return useQuery({ queryKey: ['tags'], queryFn: () => tags.list() })
}

export function useFollowedArtists() {
  const { artistFollows } = useRepositories()
  return useQuery({ queryKey: ['artistFollows', 'mine'], queryFn: () => artistFollows.listMine() })
}

export function useFollowedArtistIds() {
  const { artistFollows } = useRepositories()
  return useQuery({ queryKey: ['artistFollows', 'ids'], queryFn: () => artistFollows.getFollowedIds() })
}

export function useNotifications(tab: NotificationTab, enabled = true) {
  const { notifications } = useRepositories()
  return useQuery({
    queryKey: ['notifications', tab],
    queryFn: () => notifications.list(tab),
    enabled,
  })
}

export function useUnreadCount() {
  const { notifications } = useRepositories()
  return useQuery({ queryKey: ['notifications', 'unread'], queryFn: () => notifications.unreadCount() })
}

export function useNotificationSettings() {
  const { notifications } = useRepositories()
  return useQuery({ queryKey: ['notifications', 'settings'], queryFn: () => notifications.getSettings() })
}

// ---------------------------------------------------------------- Escrituras
// Los datos son pocos: tras cualquier escritura se invalida todo y se vuelve a pedir.

function useAct<TArgs, TRes>(
  fn: (repos: ReturnType<typeof useRepositories>, args: TArgs) => Promise<TRes>,
) {
  const repos = useRepositories()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: TArgs) => fn(repos, args),
    onSuccess: () => qc.invalidateQueries(),
  })
}

export const useSetLike = () =>
  useAct((r, a: { gigId: ID; liked: boolean }) => r.gigs.setLike(a.gigId, a.liked))

export const useMarkAttended = () => useAct((r, gigId: ID) => r.attendances.markAttended(gigId))
export const useUnmarkAttended = () => useAct((r, gigId: ID) => r.attendances.unmarkAttended(gigId))
export const useUpdateAttendance = () =>
  useAct((r, a: { gigId: ID; patch: AttendanceUpdate }) => r.attendances.update(a.gigId, a.patch))
export const useDeleteReview = () => useAct((r, gigId: ID) => r.attendances.deleteReview(gigId))
export const useToggleReviewLike = () =>
  useAct((r, a: { attendanceId: ID; liked: boolean }) =>
    r.attendances.toggleReviewLike(a.attendanceId, a.liked),
  )

export const useAddToWishlist = () => useAct((r, gigId: ID) => r.gigslists.addToWishlist(gigId))
export const useRemoveFromWishlist = () =>
  useAct((r, gigId: ID) => r.gigslists.removeFromWishlist(gigId))
export const useSetTicketStatus = () =>
  useAct((r, a: { gigId: ID; status: TicketStatus }) => r.gigslists.setTicketStatus(a.gigId, a.status))

export const useCreateList = () =>
  useAct((r, a: { title: string; description?: string | null }) => r.gigslists.createList(a))
export const useUpdateList = () =>
  useAct((r, a: { id: ID; title?: string; description?: string | null }) =>
    r.gigslists.updateList(a.id, { title: a.title, description: a.description }),
  )
export const useDeleteList = () => useAct((r, id: ID) => r.gigslists.deleteList(id))
export const useAddToList = () =>
  useAct((r, a: { listId: ID; gigId: ID }) => r.gigslists.addToList(a.listId, a.gigId))
export const useRemoveFromList = () =>
  useAct((r, a: { listId: ID; gigId: ID }) => r.gigslists.removeFromList(a.listId, a.gigId))

export const useUpdateProfile = () =>
  useAct((r, a: { displayName?: string; bio?: string; city?: string }) => r.profiles.updateProfile(a))
export const useSetFavorites = () => useAct((r, ids: ID[]) => r.profiles.setFavorites(ids))
export const useSetPlus = () => useAct((r, plus: boolean) => r.profiles.setPlus(plus))

export const useFollow = () => useAct((r, userId: ID) => r.friends.follow(userId))
export const useUnfollow = () => useAct((r, userId: ID) => r.friends.unfollow(userId))

export const useCreateTag = () => useAct((r, name: string) => r.tags.create(name))
export const useRenameTag = () =>
  useAct((r, a: { id: ID; name: string }) => r.tags.rename(a.id, a.name))
export const useRemoveTag = () => useAct((r, id: ID) => r.tags.remove(id))

export const useFollowArtist = () => useAct((r, artistId: ID) => r.artistFollows.follow(artistId))
export const useUnfollowArtist = () => useAct((r, artistId: ID) => r.artistFollows.unfollow(artistId))

export const useMarkRead = () => useAct((r, id: ID) => r.notifications.markRead(id))
export const useMarkAllRead = () => useAct((r, tab: NotificationTab) => r.notifications.markAllRead(tab))
export const useSetRadius = () => useAct((r, radiusKm: number) => r.notifications.setRadius(radiusKm))
