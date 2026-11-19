// Agenda (Plus): proximos conciertos de mis artistas y de mi ciudad (dentro de un radio).
// En la fase real este adaptador se sustituye por un proveedor de eventos con cache en servidor
// (Ticketmaster Discovery, etc.). Ver docs/ROADMAP.md.

import type { AgendaProvider } from '@/domain/repositories'
import type { AgendaResult } from '@/domain/types'
import { getMockConfig } from './config'
import { ME_ID, artistById, gigs, state, venueById, venues } from './db'
import { call } from './latency'
import { distanceKm, isPastGig, localDay, me, summary } from './selectors'

export const agendaProvider: AgendaProvider = {
  getUpcoming: (filters) =>
    call((): AgendaResult => {
      const user = me()
      const inCity = venues.filter((v) => v.city === user.city)
      // Origen: centro aproximado de las salas de la ciudad del usuario
      const origin = inCity.length
        ? {
            lat: inCity.reduce((s, v) => s + v.lat, 0) / inCity.length,
            lng: inCity.reduce((s, v) => s + v.lng, 0) / inCity.length,
          }
        : { lat: 40.4168, lng: -3.7038 }

      // "Mis artistas": los de conciertos a los que fui o a los que di like
      const myGigIds = new Set([
        ...state.attendances.filter((a) => a.userId === ME_ID).map((a) => a.gigId),
        ...state.gigLikes.filter((l) => l.userId === ME_ID).map((l) => l.gigId),
      ])
      const myArtistIds = new Set(
        [...myGigIds].flatMap((id) => {
          const g = gigs.find((x) => x.id === id)
          return g ? g.artistIds : []
        }),
      )

      if (getMockConfig().empty) return { origin: { city: user.city }, entries: [] }

      const entries = gigs
        .filter((g) => !isPastGig(g))
        .map((g) => {
          const venue = venueById.get(g.venueId)!
          const distance = distanceKm(origin.lat, origin.lng, venue.lat, venue.lng)
          const reason: ('mi_artista' | 'mi_ciudad')[] = []
          if (g.artistIds.some((id) => myArtistIds.has(id))) reason.push('mi_artista')
          if (distance <= filters.radiusKm) reason.push('mi_ciudad')
          return { g, distance, reason }
        })
        .filter((x) => x.reason.length > 0)
        .filter((x) => {
          const day = localDay(x.g.startsAt)
          if (filters.dateFrom && day < filters.dateFrom) return false
          if (filters.dateTo && day > filters.dateTo) return false
          if (filters.genre && !x.g.artistIds.some((id) => artistById.get(id)?.genre === filters.genre)) return false
          return true
        })
        .sort((a, b) => a.g.startsAt.localeCompare(b.g.startsAt))
        .map((x) => ({ ...summary(x.g.id), reason: x.reason, distanceKm: Math.round(x.distance) }))

      return { origin: { city: user.city }, entries }
    }),
}
