import type { GigRepository } from '@/domain/repositories'
import type { GigDetail, ReviewView } from '@/domain/types'
import { getMockConfig } from './config'
import { ME_ID, artists, gigs, persist, state, userById, venueById, venues, gigById } from './db'
import { call } from './latency'
import {
  followingIds,
  isPastGig,
  localDay,
  myAttendance,
  myWishlist,
  norm,
  reviewView,
  summary,
} from './selectors'

export const gigRepository: GigRepository = {
  search: (filters) =>
    call(() => {
      if (getMockConfig().empty) return []
      const q = filters.artistQuery ? norm(filters.artistQuery) : null
      const list = gigs.filter((g) => {
        const past = isPastGig(g)
        if (filters.scope === 'future' && past) return false
        if (filters.scope === 'past' && !past) return false
        if (filters.artistId && !g.artistIds.includes(filters.artistId)) return false
        const venue = venueById.get(g.venueId)!
        if (filters.city && venue.city !== filters.city) return false
        if (filters.venueId && g.venueId !== filters.venueId) return false
        if (filters.genre) {
          const ok = g.artistIds.some((id) => artists.find((a) => a.id === id)?.genre === filters.genre)
          if (!ok) return false
        }
        const day = localDay(g.startsAt)
        if (filters.dateFrom && day < filters.dateFrom) return false
        if (filters.dateTo && day > filters.dateTo) return false
        if (q) {
          const names = g.artistIds.map((id) => norm(artists.find((a) => a.id === id)?.name ?? ''))
          if (!names.some((n) => n.includes(q))) return false
        }
        return true
      })
      // Futuros primero (mas proximos antes), despues pasados (mas recientes antes)
      const future = list.filter((g) => !isPastGig(g)).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      const past = list.filter(isPastGig).sort((a, b) => b.startsAt.localeCompare(a.startsAt))
      return [...future, ...past].map((g) => summary(g.id))
    }),

  getById: (id) =>
    call((): GigDetail => {
      const base = summary(id)
      const following = new Set(followingIds())
      const reviews: ReviewView[] = state.attendances
        .filter((a) => a.gigId === id && a.review)
        .map(reviewView)
        .sort(
          (a, b) =>
            Number(following.has(b.user.id)) - Number(following.has(a.user.id)) ||
            b.likeCount - a.likeCount ||
            b.attendance.createdAt.localeCompare(a.attendance.createdAt),
        )
      const wl = myWishlist().items.find((i) => i.gigId === id)
      const contacts: GigDetail['contacts'] = base.isPast
        ? state.attendances
            .filter((a) => a.gigId === id && following.has(a.userId))
            .map((a) => ({ user: userById.get(a.userId)!, kind: 'attended' as const }))
        : state.gigslists
            .filter((l) => l.kind === 'wishlist' && following.has(l.userId) && l.items.some((i) => i.gigId === id))
            .map((l) => ({ user: userById.get(l.userId)!, kind: 'going' as const }))
      return {
        ...base,
        myAttendance: myAttendance(id),
        myTicketStatus: wl ? wl.ticketStatus : null,
        myListIds: state.gigslists
          .filter((l) => l.userId === ME_ID && l.kind === 'custom' && l.items.some((i) => i.gigId === id))
          .map((l) => l.id),
        reviews,
        contacts,
      }
    }),

  getFacets: () =>
    call(() => ({
      cities: [...new Set(venues.map((v) => v.city))].sort((a, b) => a.localeCompare(b, 'es')),
      genres: [...new Set(artists.map((a) => a.genre).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
      venues: [...venues].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    })),

  searchArtists: (query) =>
    call(() => {
      const q = norm(query.trim())
      if (!q) return []
      return artists.filter((a) => norm(a.name).includes(q)).slice(0, 8)
    }),

  getVenue: (id) =>
    call(() => {
      const venue = venueById.get(id)
      if (!venue) throw new Error('Sala no encontrada')
      const here = gigs.filter((g) => g.venueId === id)
      return {
        venue,
        upcoming: here
          .filter((g) => !isPastGig(g))
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
          .map((g) => summary(g.id)),
        past: here
          .filter(isPastGig)
          .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
          .slice(0, 20)
          .map((g) => summary(g.id)),
      }
    }),

  setLike: (gigId, liked) =>
    call(() => {
      if (!gigById.has(gigId)) throw new Error('Concierto no encontrado')
      const exists = state.gigLikes.some((l) => l.userId === ME_ID && l.gigId === gigId)
      if (liked && !exists) state.gigLikes.push({ userId: ME_ID, gigId })
      if (!liked && exists)
        state.gigLikes = state.gigLikes.filter((l) => !(l.userId === ME_ID && l.gigId === gigId))
      persist()
    }),
}
