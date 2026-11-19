import type { FeedRepository } from '@/domain/repositories'
import type { HomeFeed } from '@/domain/types'
import { getMockConfig } from './config'
import { gigs, state, userById, venueById } from './db'
import { call } from './latency'
import { followingIds, isPastGig, me, reviewView, summary } from './selectors'

export const feedRepository: FeedRepository = {
  getHome: () =>
    call((): HomeFeed => {
      const empty = getMockConfig().empty
      const following = new Set(followingIds())

      if (following.size > 0) {
        if (empty) return { mode: 'contacts', wishlistAdds: [], reviews: [] }
        const wishlistAdds = state.activities
          .filter((a) => a.type === 'wishlist_add' && following.has(a.userId))
          .filter((a) => !isPastGig(gigs.find((g) => g.id === a.gigId)!))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 10)
          .map((a) => ({ user: userById.get(a.userId)!, gig: summary(a.gigId), addedAt: a.createdAt }))
        const reviews = state.attendances
          .filter((a) => a.review && following.has(a.userId))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 10)
          .map(reviewView)
        return { mode: 'contacts', wishlistAdds, reviews }
      }

      // Sin contactos: novedades y wishlist de mi ciudad
      const city = me().city
      if (empty) return { mode: 'city', city, latestInCity: [], wishlistOfCity: [] }
      const inCity = gigs.filter((g) => !isPastGig(g) && venueById.get(g.venueId)!.city === city)
      const latestInCity = [...inCity]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 10)
        .map((g) => summary(g.id))
      const saves = new Map<string, number>()
      for (const l of state.gigslists.filter((x) => x.kind === 'wishlist'))
        for (const i of l.items) saves.set(i.gigId, (saves.get(i.gigId) ?? 0) + 1)
      const wishlistOfCity = inCity
        .map((g) => ({ g, n: saves.get(g.id) ?? 0 }))
        .filter((x) => x.n > 0)
        .sort((a, b) => b.n - a.n)
        .slice(0, 10)
        .map((x) => ({ ...summary(x.g.id), saves: x.n }))
      return { mode: 'city', city, latestInCity, wishlistOfCity }
    }),
}
