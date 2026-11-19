// Buzon de avisos. En la fase real, los avisos de like y seguidor los crean triggers de la base de
// datos y los de artistas una tarea periodica (ver docs/ROADMAP.md). Aqui salen del seed.

import type { NotificationRepository } from '@/domain/repositories'
import {
  NOTIFICATION_RADIUS_OPTIONS,
  type ID,
  type Notification,
  type NotificationTab,
  type NotificationType,
  type NotificationView,
} from '@/domain/types'
import { getMockConfig } from './config'
import { ME_ID, artistById, gigById, gigs, newId, nowIso, persist, state, userById, venueById } from './db'
import { call } from './latency'
import { cityOrigin, distanceKm, isPastGig, me, summary } from './selectors'

const tabOf = (t: NotificationType): NotificationTab =>
  t === 'artist_gig_announced' ? 'artists' : 'interactions'

/** Un aviso de artista solo cuenta si el artista sigue seguido, el concierto no ha pasado y esta en el radio. */
function visible(n: Notification): boolean {
  if (n.type !== 'artist_gig_announced') return true
  const gig = n.gigId ? gigById.get(n.gigId) : undefined
  if (!gig || !n.artistId || isPastGig(gig)) return false
  if (!state.artistFollows.some((f) => f.userId === ME_ID && f.artistId === n.artistId)) return false
  const venue = venueById.get(gig.venueId)
  if (!venue) return false
  const o = cityOrigin(me().city)
  return distanceKm(o.lat, o.lng, venue.lat, venue.lng) <= state.radiusKm
}

const mine = (tab: NotificationTab) =>
  state.notifications
    .filter((n) => n.userId === ME_ID && tabOf(n.type) === tab && visible(n))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

function toView(n: Notification): NotificationView {
  return {
    notification: n,
    actor: n.actorId ? (userById.get(n.actorId) ?? null) : null,
    gig: n.gigId ? summary(n.gigId) : null,
    artist: n.artistId ? (artistById.get(n.artistId) ?? null) : null,
  }
}

export const notificationRepository: NotificationRepository = {
  list: (tab) => call(() => (getMockConfig().empty ? [] : mine(tab).map(toView))),

  unreadCount: () =>
    call(() => {
      if (getMockConfig().empty) return 0
      const unread = (tab: NotificationTab) => mine(tab).filter((n) => !n.read).length
      return unread('interactions') + (state.plus ? unread('artists') : 0)
    }),

  markRead: (id) =>
    call(() => {
      const n = state.notifications.find((x) => x.id === id && x.userId === ME_ID)
      if (!n) throw new Error('Aviso no encontrado')
      n.read = true
      persist()
    }),

  markAllRead: (tab) =>
    call(() => {
      for (const n of state.notifications) if (n.userId === ME_ID && tabOf(n.type) === tab) n.read = true
      persist()
    }),

  getSettings: () => call(() => ({ radiusKm: state.radiusKm })),

  setRadius: (radiusKm) =>
    call(() => {
      if (!(NOTIFICATION_RADIUS_OPTIONS as readonly number[]).includes(radiusKm)) throw new Error('Radio no valido')
      state.radiusKm = radiusKm
      persist()
      return { radiusKm }
    }),
}

/** Solo para el panel de desarrollo: crea un aviso de artista nuevo sin leer, para probar el contador. */
export function generateTestNotification(): ID | null {
  const followed = new Set(state.artistFollows.filter((f) => f.userId === ME_ID).map((f) => f.artistId))
  const notified = new Set(state.notifications.filter((n) => n.type === 'artist_gig_announced').map((n) => n.gigId))
  const future = gigs.filter((g) => !isPastGig(g) && !notified.has(g.id))
  if (!future.length) return null
  const o = cityOrigin(me().city)
  const inRadius = (g: (typeof gigs)[number]) => {
    const v = venueById.get(g.venueId)!
    return distanceKm(o.lat, o.lng, v.lat, v.lng) <= state.radiusKm
  }
  const pool = (cands: typeof future) => {
    const near = cands.filter(inRadius)
    return near.length ? near : cands
  }
  const candidates = future.filter((g) => g.artistIds.some((id) => followed.has(id)))
  const gig = pool(candidates.length ? candidates : future)[0]
  if (!gig) return null
  // Sin artistas seguidos con conciertos disponibles: se sigue al cabeza de cartel de uno
  let artistId = gig.artistIds.find((id) => followed.has(id))
  if (!artistId) {
    artistId = gig.artistIds[0]
    state.artistFollows.push({ userId: ME_ID, artistId, createdAt: nowIso() })
  }
  const id = newId()
  state.notifications.push({
    id,
    userId: ME_ID,
    type: 'artist_gig_announced',
    createdAt: nowIso(),
    read: false,
    actorId: null,
    gigId: gig.id,
    artistId,
    attendanceId: null,
  })
  persist()
  return id
}
