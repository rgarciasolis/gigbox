import type { FriendRepository } from '@/domain/repositories'
import { getMockConfig } from './config'
import { ME_ID, persist, state, userById, users } from './db'
import { call } from './latency'
import { followerIds, followingIds, norm, userSummary } from './selectors'

export const friendRepository: FriendRepository = {
  follow: (userId) =>
    call(() => {
      if (userId === ME_ID) throw new Error('No puedes seguirte a ti mismo')
      if (!userById.has(userId)) throw new Error('Usuario no encontrado')
      if (!state.follows.some((f) => f.followerId === ME_ID && f.followeeId === userId))
        state.follows.push({ followerId: ME_ID, followeeId: userId, createdAt: new Date().toISOString() })
      persist()
    }),

  unfollow: (userId) =>
    call(() => {
      state.follows = state.follows.filter((f) => !(f.followerId === ME_ID && f.followeeId === userId))
      persist()
    }),

  listFollowing: (userId) =>
    call(() => (getMockConfig().empty ? [] : followingIds(userId).map(userSummary))),

  listFollowers: (userId) =>
    call(() => (getMockConfig().empty ? [] : followerIds(userId).map(userSummary))),

  searchUsers: (query) =>
    call(() => {
      const q = norm(query.trim())
      const pool = users.filter((u) => u.id !== ME_ID)
      if (!q) {
        // Sin busqueda: sugerencias (personas con mas conciertos que aun no sigues)
        return pool
          .map((u) => userSummary(u.id))
          .filter((s) => !s.isFollowing)
          .sort((a, b) => b.concertsTotal - a.concertsTotal)
          .slice(0, 10)
      }
      return pool
        .filter((u) => [u.username, u.displayName, u.city].some((f) => norm(f).includes(q)))
        .slice(0, 20)
        .map((u) => userSummary(u.id))
    }),
}
