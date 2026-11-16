// Composicion de vistas a partir de la db mock.
import type { Attendance, Gig } from '@/domain/types'
import type { ActivityView, AttendanceView, GigView } from '@/domain/views'
import type { Db } from './db'

export const me = (db: Db) => db.users.find((u) => u.id === db.meta.currentUserId)!

export function followingIds(db: Db): Set<string> {
  return new Set(db.follows.filter((f) => f.followerId === db.meta.currentUserId).map((f) => f.followeeId))
}

export function gigView(db: Db, gig: Gig): GigView {
  const venue = db.venues.find((v) => v.id === gig.venueId)!
  const artists = gig.artistIds.map((id) => db.artists.find((a) => a.id === id)!).filter(Boolean)
  const atts = db.attendances.filter((a) => a.gigId === gig.id)
  const rated = atts.filter((a) => a.rating !== null)
  const avg = rated.length ? rated.reduce((s, a) => s + (a.rating as number), 0) / rated.length : null
  return {
    gig, artists, venue,
    avgRating: avg,
    ratingCount: rated.length,
    reviewCount: atts.filter((a) => a.review).length,
    mine: atts.find((a) => a.userId === db.meta.currentUserId) ?? null,
    isUpcoming: Date.parse(gig.date) >= Date.now(),
  }
}

export function attendanceView(db: Db, a: Attendance): AttendanceView {
  const gig = db.gigs.find((g) => g.id === a.gigId)!
  return { attendance: a, gig: gigView(db, gig), tags: db.tags.filter((t) => a.tagIds.includes(t.id)) }
}

export function activityView(db: Db, id: string): ActivityView | null {
  const act = db.activities.find((a) => a.id === id)
  if (!act) return null
  const gig = act.gigId ? db.gigs.find((g) => g.id === act.gigId) : undefined
  return {
    activity: act,
    user: db.users.find((u) => u.id === act.userId)!,
    gig: gig ? gigView(db, gig) : null,
    targetUser: act.targetUserId ? db.users.find((u) => u.id === act.targetUserId) ?? null : null,
  }
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371, rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export function addActivity(db: Db, act: Omit<import('@/domain/types').Activity, 'id' | 'createdAt'>, uuid: () => string) {
  db.activities.push({ ...act, id: uuid(), createdAt: new Date().toISOString() })
}
