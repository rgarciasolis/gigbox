import type { AttendanceRepository } from '@/domain/repositories'
import type { AttendanceView, Attendance } from '@/domain/types'
import { getMockConfig } from './config'
import { ME_ID, gigById, newId, nowIso, persist, state } from './db'
import { call } from './latency'
import { followingIds, isPastGig, myAttendance, myWishlist, reviewView, summary } from './selectors'

function requireMine(gigId: string): Attendance {
  const a = myAttendance(gigId)
  if (!a) throw new Error('Primero marca Fui en este concierto')
  return a
}

function validRating(r: number) {
  return r >= 0.5 && r <= 5 && Math.round(r * 2) === r * 2
}

export const attendanceRepository: AttendanceRepository = {
  markAttended: (gigId) =>
    call(() => {
      const gig = gigById.get(gigId)
      if (!gig) throw new Error('Concierto no encontrado')
      if (!isPastGig(gig)) throw new Error('Fui solo se puede marcar en conciertos pasados')
      const existing = myAttendance(gigId)
      if (existing) return existing
      const att: Attendance = {
        id: newId(),
        userId: ME_ID,
        gigId,
        rating: null,
        review: null,
        tagIds: [],
        photoUrl: null,
        createdAt: nowIso(),
      }
      state.attendances.push(att)
      // Si estaba en la wishlist, deja de ser un "voy a ir"
      const wl = myWishlist()
      wl.items = wl.items.filter((i) => i.gigId !== gigId)
      state.activities.push({
        id: newId(), userId: ME_ID, type: 'attended', gigId, attendanceId: att.id, createdAt: att.createdAt,
      })
      persist()
      return att
    }),

  unmarkAttended: (gigId) =>
    call(() => {
      const att = myAttendance(gigId)
      if (!att) return
      state.attendances = state.attendances.filter((a) => a.id !== att.id)
      state.activities = state.activities.filter((a) => a.attendanceId !== att.id)
      state.reviewLikes = state.reviewLikes.filter((l) => l.attendanceId !== att.id)
      state.favorites[ME_ID] = (state.favorites[ME_ID] ?? []).filter((id) => id !== gigId)
      persist()
    }),

  update: (gigId, patch) =>
    call(() => {
      const att = requireMine(gigId)
      if (patch.rating !== undefined) {
        if (patch.rating !== null && !validRating(patch.rating))
          throw new Error('La nota va de 0,5 a 5 en pasos de 0,5')
        att.rating = patch.rating
      }
      if (patch.review !== undefined) {
        const text = patch.review?.trim() || null
        const had = !!att.review
        att.review = text
        if (text && !had)
          state.activities.push({
            id: newId(), userId: ME_ID, type: 'review', gigId, attendanceId: att.id, createdAt: nowIso(),
          })
        if (!text && had)
          state.activities = state.activities.filter((a) => !(a.attendanceId === att.id && a.type === 'review'))
      }
      if (patch.tagIds !== undefined) att.tagIds = patch.tagIds
      if (patch.photoUrl !== undefined) att.photoUrl = patch.photoUrl
      persist()
      return att
    }),

  listMine: (filters) =>
    call((): AttendanceView[] => {
      if (getMockConfig().empty) return []
      return state.attendances
        .filter((a) => a.userId === ME_ID)
        .filter((a) => !filters?.tagId || a.tagIds.includes(filters.tagId))
        .map((a) => ({
          attendance: a,
          gig: summary(a.gigId),
          tags: state.tags.filter((t) => a.tagIds.includes(t.id)),
          liked: state.gigLikes.some((l) => l.userId === ME_ID && l.gigId === a.gigId),
        }))
        .sort((a, b) => b.gig.gig.startsAt.localeCompare(a.gig.gig.startsAt))
    }),

  listReviews: (scope) =>
    call(() => {
      if (getMockConfig().empty) return []
      const following = new Set(followingIds())
      return state.attendances
        .filter((a) => a.review && (scope === 'mine' ? a.userId === ME_ID : following.has(a.userId)))
        .map(reviewView)
        .sort((a, b) => b.attendance.createdAt.localeCompare(a.attendance.createdAt))
    }),

  deleteReview: (gigId) =>
    call(() => {
      const att = requireMine(gigId)
      att.review = null
      state.activities = state.activities.filter((a) => !(a.attendanceId === att.id && a.type === 'review'))
      persist()
    }),

  toggleReviewLike: (attendanceId, liked) =>
    call(() => {
      const exists = state.reviewLikes.some((l) => l.userId === ME_ID && l.attendanceId === attendanceId)
      if (liked && !exists) state.reviewLikes.push({ userId: ME_ID, attendanceId })
      if (!liked)
        state.reviewLikes = state.reviewLikes.filter(
          (l) => !(l.userId === ME_ID && l.attendanceId === attendanceId),
        )
      persist()
    }),
}
