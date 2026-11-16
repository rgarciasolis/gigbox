import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAddToGigslist, useGigslists } from '@/data/hooks'
import type { ActivityView, GigView, ReviewView } from '@/domain/views'
import { fmtDate, fmtRating } from '@/lib'
import { Avatar, ErrorBox, Rating, UserLink } from './ui'

export function GigCard({ view, extra }: { view: GigView; extra?: React.ReactNode }) {
  const { gig, artists, venue } = view
  return (
    <div className="card flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link to={`/gigs/${gig.id}`} className="font-medium hover:underline">{gig.title}</Link>
        <p className="muted truncate">{artists.map((a) => a.name).join(' · ')}</p>
        <p className="muted">{fmtDate(gig.date)} · {venue.name}, {venue.city}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-sm">
        {view.mine && (
          <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs">
            {view.mine.status === 'going' ? 'Voy' : 'Asistí'}
            {view.mine.rating ? ` · ${fmtRating(view.mine.rating)}★` : ''}
          </span>
        )}
        {view.avgRating !== null && <span title={`${view.ratingCount} notas`}>{fmtRating(view.avgRating)}★</span>}
        {extra}
      </div>
    </div>
  )
}

export function ReviewCard({ r, showGig = true }: { r: ReviewView; showGig?: boolean }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2">
        <Avatar user={r.user} size={28} />
        <UserLink user={r.user} />
        <Rating value={r.attendance.rating} />
        <span className="muted ml-auto">{fmtDate(r.attendance.createdAt)}</span>
      </div>
      {showGig && <p className="mt-1 text-sm"><Link className="underline" to={`/gigs/${r.gig.gig.id}`}>{r.gig.gig.title}</Link> <span className="muted">· {r.gig.venue.name}</span></p>}
      <p className="mt-1 text-sm">{r.attendance.review}</p>
    </div>
  )
}

const VERB: Record<string, string> = { attended: 'asistió a', rated: 'puntuó', reviewed: 'reseñó', saved: 'guardó', going: 'va a', followed: 'empezó a seguir a' }

export function ActivityRow({ a }: { a: ActivityView }) {
  const { activity: act } = a
  return (
    <li className="flex items-start gap-2 py-2 text-sm">
      <Avatar user={a.user} size={28} />
      <div>
        <UserLink user={a.user} /> {VERB[act.type]}{' '}
        {a.gig && <Link to={`/gigs/${a.gig.gig.id}`} className="underline">{a.gig.gig.title}</Link>}
        {a.targetUser && <UserLink user={a.targetUser} />}
        {act.type === 'rated' && act.rating && <> <span className="text-amber-600">{fmtRating(act.rating)}★</span></>}
        <p className="muted">{fmtDate(act.createdAt)}</p>
      </div>
    </li>
  )
}

/** Guarda un gig en una gigslist (por defecto la primera, "Quiero ir"). */
export function AddToGigslist({ gigId, compact }: { gigId: string; compact?: boolean }) {
  const lists = useGigslists()
  const add = useAddToGigslist()
  const [target, setTarget] = useState<string>('')
  if (lists.isError) return <ErrorBox error={lists.error} />
  const all = lists.data ?? []
  const chosen = target || all.find((l) => l.gigslist.isDefault)?.gigslist.id || all[0]?.gigslist.id
  const saved = all.filter((l) => l.items.some((i) => i.gig.gig.id === gigId)).map((l) => l.gigslist.id)
  const isSaved = chosen ? saved.includes(chosen) : false
  return (
    <span className="inline-flex items-center gap-1">
      {!compact && (
        <select className="input w-auto" value={chosen ?? ''} onChange={(e) => setTarget(e.target.value)} aria-label="Gigslist">
          {all.map((l) => <option key={l.gigslist.id} value={l.gigslist.id}>{l.gigslist.name}{saved.includes(l.gigslist.id) ? ' ✓' : ''}</option>)}
        </select>
      )}
      <button className="btn" disabled={!chosen || isSaved || add.isPending} onClick={() => chosen && add.mutate({ gigslistId: chosen, gigId })}>
        {isSaved ? 'En Gigslist ✓' : add.isPending ? 'Guardando…' : '+ Gigslist'}
      </button>
      {add.isError && <span className="text-xs text-red-700">{(add.error as Error).message}</span>}
    </span>
  )
}
