import type { ProfileRepository } from '@/domain/repositories'
import type { ID, ProfileView, StatsView } from '@/domain/types'
import { ME_ID, artistById, gigById, persist, state, userById, venueById } from './db'
import { call } from './latency'
import { followerIds, followingIds, me, summary } from './selectors'

function attendedGigs(userId: ID) {
  return state.attendances
    .filter((a) => a.userId === userId)
    .map((a) => gigById.get(a.gigId)!)
    .filter(Boolean)
}

function top<T>(counts: Map<string, number>, resolve: (k: string) => T, n = 5) {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, count]) => ({ item: resolve(k), count }))
}

export const profileRepository: ProfileRepository = {
  getCurrentUser: () => call(() => me()),

  getProfile: (userId) =>
    call((): ProfileView => {
      const user = userId === ME_ID ? me() : userById.get(userId)
      if (!user) throw new Error('Usuario no encontrado')
      const gigs = attendedGigs(userId)
      const year = new Date().getFullYear()
      const artistIds = new Set(gigs.flatMap((g) => g.artistIds))
      const venueIds = new Set(gigs.map((g) => g.venueId))
      const cities = new Set(gigs.map((g) => venueById.get(g.venueId)!.city))
      const sorted = [...gigs].sort((a, b) => b.startsAt.localeCompare(a.startsAt))
      const recentActivity = state.activities
        .filter((a) => a.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 8)
        .map((activity) => ({
          activity,
          user,
          gig: summary(activity.gigId),
          review: activity.attendanceId
            ? (state.attendances.find((x) => x.id === activity.attendanceId) ?? null)
            : null,
        }))
      return {
        user,
        stats: {
          concertsTotal: gigs.length,
          concertsThisYear: gigs.filter((g) => new Date(g.startsAt).getFullYear() === year).length,
          artists: artistIds.size,
          venues: venueIds.size,
          cities: cities.size,
          following: followingIds(userId).length,
          followers: followerIds(userId).length,
        },
        favorites: (state.favorites[userId] ?? []).filter((id) => gigById.has(id)).map(summary),
        latest: sorted.slice(0, 5).map((g) => summary(g.id)),
        recentActivity,
        isMe: userId === ME_ID,
        isFollowing: followingIds().includes(userId),
      }
    }),

  updateProfile: (patch) =>
    call(() => {
      if (patch.displayName !== undefined && !patch.displayName.trim())
        throw new Error('El nombre no puede estar vacio')
      state.mePatch = { ...state.mePatch, ...patch }
      persist()
      return me()
    }),

  setFavorites: (gigIds) =>
    call(() => {
      if (gigIds.length > 5) throw new Error('Maximo 5 favoritos')
      const attended = new Set(attendedGigs(ME_ID).map((g) => g.id))
      if (!gigIds.every((id) => attended.has(id)))
        throw new Error('Solo puedes elegir conciertos a los que fuiste')
      state.favorites[ME_ID] = gigIds
      persist()
    }),

  getFavoriteIds: () => call(() => state.favorites[ME_ID] ?? []),

  getStats: () =>
    call((): StatsView => {
      const mine = state.attendances.filter((a) => a.userId === ME_ID)
      const gigs = mine.map((a) => gigById.get(a.gigId)!).filter(Boolean)
      const byYear = new Map<string, number>()
      const artistCount = new Map<string, number>()
      const venueCount = new Map<string, number>()
      const cityCount = new Map<string, number>()
      const genreCount = new Map<string, number>()
      for (const g of gigs) {
        const y = String(new Date(g.startsAt).getFullYear())
        byYear.set(y, (byYear.get(y) ?? 0) + 1)
        for (const id of g.artistIds) {
          artistCount.set(id, (artistCount.get(id) ?? 0) + 1)
          const genre = artistById.get(id)?.genre
          if (genre) genreCount.set(genre, (genreCount.get(genre) ?? 0) + 1)
        }
        venueCount.set(g.venueId, (venueCount.get(g.venueId) ?? 0) + 1)
        const city = venueById.get(g.venueId)!.city
        cityCount.set(city, (cityCount.get(city) ?? 0) + 1)
      }
      const rated = mine.filter((a) => a.rating !== null)
      return {
        byYear: [...byYear.entries()]
          .map(([y, count]) => ({ year: Number(y), count }))
          .sort((a, b) => b.year - a.year),
        topArtists: top(artistCount, (k) => artistById.get(k)!).map((x) => ({ artist: x.item, count: x.count })),
        topVenues: top(venueCount, (k) => venueById.get(k)!).map((x) => ({ venue: x.item, count: x.count })),
        topCities: top(cityCount, (k) => k).map((x) => ({ city: x.item, count: x.count })),
        topGenres: top(genreCount, (k) => k).map((x) => ({ genre: x.item, count: x.count })),
        avgRating: rated.length ? rated.reduce((s, a) => s + (a.rating as number), 0) / rated.length : null,
      }
    }),

  getSubscription: () => call(() => ({ plus: state.plus })),

  setPlus: (plus) =>
    call(() => {
      state.plus = plus
      persist()
      return { plus }
    }),
}
