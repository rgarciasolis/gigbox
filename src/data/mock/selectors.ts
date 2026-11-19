// Funciones de lectura compartidas por los repositorios mock (componen las vistas del dominio).

import type {
  Attendance,
  Gig,
  GigSummary,
  Gigslist,
  ID,
  ReviewView,
  UserSummary,
} from '@/domain/types'
import { getMockConfig } from './config'
import {
  ME_ID,
  artistById,
  gigById,
  state,
  userById,
  users,
  venueById,
} from './db'

export const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export const isPastGig = (g: Gig) => new Date(g.startsAt).getTime() < Date.now()

export function me() {
  const base = userById.get(ME_ID)!
  return { ...base, ...state.mePatch }
}

export function followingIds(userId: ID = ME_ID): ID[] {
  if (userId === ME_ID && getMockConfig().noContacts) return []
  return state.follows.filter((f) => f.followerId === userId).map((f) => f.followeeId)
}

export function followerIds(userId: ID): ID[] {
  return state.follows.filter((f) => f.followeeId === userId).map((f) => f.followerId)
}

export function myWishlist(): Gigslist {
  const l = state.gigslists.find((x) => x.userId === ME_ID && x.kind === 'wishlist')
  if (!l) throw new Error('El usuario no tiene wishlist')
  return l
}

export function myAttendance(gigId: ID): Attendance | null {
  return state.attendances.find((a) => a.userId === ME_ID && a.gigId === gigId) ?? null
}

export function summary(gigId: ID): GigSummary {
  const gig = gigById.get(gigId)
  if (!gig) throw new Error('Concierto no encontrado')
  const att = state.attendances.filter((a) => a.gigId === gigId)
  const rated = att.filter((a) => a.rating !== null)
  const avgRating = rated.length
    ? rated.reduce((s, a) => s + (a.rating as number), 0) / rated.length
    : null
  return {
    gig,
    artists: gig.artistIds.map((id) => artistById.get(id)!).filter(Boolean),
    venue: venueById.get(gig.venueId)!,
    avgRating,
    attendeeCount: att.length,
    isPast: isPastGig(gig),
    likedByMe: state.gigLikes.some((l) => l.userId === ME_ID && l.gigId === gigId),
    inMyWishlist: myWishlist().items.some((i) => i.gigId === gigId),
    attendedByMe: att.some((a) => a.userId === ME_ID),
  }
}

export function reviewView(att: Attendance): ReviewView {
  return {
    attendance: att,
    user: { ...userById.get(att.userId)!, ...(att.userId === ME_ID ? state.mePatch : {}) },
    gig: summary(att.gigId),
    likeCount: state.reviewLikes.filter((l) => l.attendanceId === att.id).length,
    likedByMe: state.reviewLikes.some((l) => l.attendanceId === att.id && l.userId === ME_ID),
  }
}

export function userSummary(userId: ID): UserSummary {
  const u = userById.get(userId)!
  return {
    user: userId === ME_ID ? me() : u,
    isFollowing: followingIds().includes(userId),
    concertsTotal: state.attendances.filter((a) => a.userId === userId).length,
  }
}

export function allUsers() {
  return users
}

export function byDateAsc(a: { startsAt: string }, b: { startsAt: string }) {
  return a.startsAt.localeCompare(b.startsAt)
}

export function localDay(iso: string) {
  const d = new Date(iso)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}
