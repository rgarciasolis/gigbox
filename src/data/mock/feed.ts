import type { FeedRepository } from '@/domain/repositories'
import { ACTIVITY_LIST_MAX, HOME_BLOCK_SIZE } from '@/domain/limits'
import type { ContactWishlistAdd, HomeFeed, ReviewView } from '@/domain/types'
import { getMockConfig } from './config'
import { gigs, state, userById, venueById } from './db'
import { call } from './latency'
import { followingIds, isPastGig, me, reviewView, summary } from './selectors'

function contactWishlistAdds(): ContactWishlistAdd[] {
  if (getMockConfig().empty) return []
  const following = new Set(followingIds())
  return state.activities
    .filter((a) => a.type === 'wishlist_add' && following.has(a.userId))
    .filter((a) => !isPastGig(gigs.find((g) => g.id === a.gigId)!))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, ACTIVITY_LIST_MAX)
    .map((a) => ({ user: userById.get(a.userId)!, gig: summary(a.gigId), addedAt: a.createdAt }))
}

function contactReviews(): ReviewView[] {
  if (getMockConfig().empty) return []
  const following = new Set(followingIds())
  return state.attendances
    .filter((a) => a.review && following.has(a.userId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, ACTIVITY_LIST_MAX)
    .map(reviewView)
}

export const feedRepository: FeedRepository = {
  listContactWishlistAdds: () => call(contactWishlistAdds),
  listContactReviews: () => call(contactReviews),
  getHome: () =>
    call((): HomeFeed => {
      const empty = getMockConfig().empty
      const following = new Set(followingIds())

      if (following.size > 0) {
        const adds = contactWishlistAdds()
        const reviews = contactReviews()
        return {
          mode: 'contacts',
          wishlistAdds: adds.slice(0, HOME_BLOCK_SIZE),
          moreWishlistAdds: adds.length > HOME_BLOCK_SIZE,
          reviews: reviews.slice(0, HOME_BLOCK_SIZE),
          moreReviews: reviews.length > HOME_BLOCK_SIZE,
        }
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
