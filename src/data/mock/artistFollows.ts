// Artistas que sigue el usuario (gratis). Los avisos de sus conciertos nuevos son Plus.

import type { ArtistFollowRepository } from '@/domain/repositories'
import { getMockConfig } from './config'
import { ME_ID, artistById, persist, state } from './db'
import { call } from './latency'

const myIds = () => state.artistFollows.filter((f) => f.userId === ME_ID).map((f) => f.artistId)

export const artistFollowRepository: ArtistFollowRepository = {
  listMine: () =>
    call(() =>
      getMockConfig().empty
        ? []
        : myIds()
            .map((id) => artistById.get(id)!)
            .filter(Boolean)
            .sort((a, b) => a.name.localeCompare(b.name, 'es')),
    ),

  getFollowedIds: () => call(() => myIds()),

  follow: (artistId) =>
    call(() => {
      if (!artistById.has(artistId)) throw new Error('Artista no encontrado')
      if (!myIds().includes(artistId))
        state.artistFollows.push({ userId: ME_ID, artistId, createdAt: new Date().toISOString() })
      persist()
    }),

  unfollow: (artistId) =>
    call(() => {
      state.artistFollows = state.artistFollows.filter((f) => !(f.userId === ME_ID && f.artistId === artistId))
      persist()
    }),
}
