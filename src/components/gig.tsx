import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAddToGigslist, useGigslists } from '@/data/hooks'
import type { ActivityView, FriendAttendanceView, GigView, ReviewView } from '@/domain/views'
import type { User } from '@/domain/types'
import { fmtRating, fmtTileDate, stars } from '@/lib'
import { Avatar, ErrorBox, UserLink } from './ui'

/**
 * Tarjeta de concierto de Figma (01_Home / What's Hot Today):
 * banda de fecha, titular Kurrent centrado, fila de persona/estado y banda oscura con la sala.
 * `who` muestra a un amigo; `extra` aloja acciones (se coloca sobre el enlace de la tarjeta).
 */
export function GigCard({ view, extra, who, note }: { view: GigView; extra?: React.ReactNode; who?: User; note?: string }) {
  const { gig, artists, venue } = view
  const headliner = artists[0]?.name ?? gig.title
  const support = artists.slice(1).map((a) => a.name).join(', ')
  return (
    <article className="relative flex flex-col overflow-hidden rounded bg-green-50 transition hover:bg-green-100">
      <p className="flex h-[22px] items-center justify-center bg-green-50 text-sm text-zinc-950">{fmtTileDate(gig.date)}</p>
      <div className="flex-1 px-4 pb-2 pt-2 text-center">
        <h3 className="font-heading text-3xl font-bold leading-[1.05] text-[#151515]">
          <Link to={`/gigs/${gig.id}`} className="after:absolute after:inset-0 after:content-['']">{headliner}</Link>
        </h3>
        {support && <p className="mt-2 line-clamp-2 font-heading text-2xl font-bold leading-tight text-[#151515]">{support}</p>}
      </div>
      <div className="flex min-h-[40px] flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-2">
        {who && <span className="flex items-center gap-2.5 text-lg text-[#151515]"><Avatar user={who} size={24} />{who.displayName}</span>}
        {note && <span className="text-sm text-zinc-700">{note}</span>}
        {view.mine && (
          <span className="rounded-sm bg-green-600 px-1.5 py-0.5 text-xs font-bold uppercase text-zinc-50">
            {view.mine.status === 'going' ? 'Voy' : 'Asistí'}{view.mine.rating ? ` · ${fmtRating(view.mine.rating)}★` : ''}
          </span>
        )}
        {view.avgRating !== null && <span className="text-sm text-zinc-700" title={`${view.ratingCount} notas`}><span className="text-green-700">★</span> {fmtRating(view.avgRating)}</span>}
        {extra && <span className="relative z-10 ml-auto flex items-center gap-2 text-sm text-zinc-700">{extra}</span>}
      </div>
      <p className="truncate bg-green-950 px-2 py-[5px] text-center text-xs uppercase text-green-50">{venue.name}, {venue.city}</p>
    </article>
  )
}

/** Cuadricula de tarjetas (misma que What's Hot Today). */
export function GigGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>
}

export function FriendAttendanceRow({ v }: { v: FriendAttendanceView }) {
  return (
    <div className="flex items-center gap-2 rounded bg-green-50 p-3">
      <Avatar user={v.user} size={24} />
      <div className="min-w-0 flex-1">
        <p className="text-lg">
          <UserLink user={v.user} /> <span className="text-zinc-500">asistió a</span>{' '}
          <Link to={`/gigs/${v.gig.gig.id}`} className="font-bold hover:underline">{v.gig.gig.title}</Link>
        </p>
        <p className="truncate text-sm text-zinc-500">{fmtTileDate(v.gig.gig.date)} – {v.gig.venue.name}, {v.gig.venue.city}</p>
      </div>
      {v.attendance.rating !== null && <span className="shrink-0 text-sm text-green-700">{fmtRating(v.attendance.rating)}★</span>}
    </div>
  )
}

/** Reseña de Figma: autor, titulo en Inter Bold 20, meta en 12px, estrellas verdes y texto. Sin caja. */
export function ReviewCard({ r, showGig = true }: { r: ReviewView; showGig?: boolean }) {
  return (
    <article className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-lg"><Avatar user={r.user} size={24} /><UserLink user={r.user} /></p>
      <div className="flex flex-col gap-0.5">
        {showGig && (
          <h3 className="font-body text-xl font-bold leading-tight text-zinc-700">
            <Link to={`/gigs/${r.gig.gig.id}`} className="hover:underline">{r.gig.gig.title}</Link>
          </h3>
        )}
        <p className="text-sm text-zinc-500">{fmtTileDate(r.attendance.createdAt)}{showGig ? ` – ${r.gig.venue.name}, ${r.gig.venue.city}` : ''}</p>
        {r.attendance.rating !== null && <p className="text-lg text-green-600" title={`${fmtRating(r.attendance.rating)} / 5`}>{stars(r.attendance.rating)}</p>}
      </div>
      <p className="text-lg leading-relaxed text-zinc-800">{r.attendance.review}</p>
    </article>
  )
}

/** Rejilla de dos columnas para reseñas (ancho de Figma: 607 + hueco). */
export function ReviewGrid({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto grid max-w-reviews gap-x-16 gap-y-10 md:grid-cols-2">{children}</div>
}

const VERB: Record<string, string> = { attended: 'asistió a', rated: 'puntuó', reviewed: 'reseñó', saved: 'guardó', going: 'va a', followed: 'empezó a seguir a' }

export function ActivityRow({ a }: { a: ActivityView }) {
  const { activity: act } = a
  return (
    <li className="flex items-start gap-3 py-3 text-lg">
      <Avatar user={a.user} size={24} />
      <div>
        <UserLink user={a.user} /> <span className="text-zinc-500">{VERB[act.type]}</span>{' '}
        {a.gig && <Link to={`/gigs/${a.gig.gig.id}`} className="font-bold hover:underline">{a.gig.gig.title}</Link>}
        {a.targetUser && <UserLink user={a.targetUser} />}
        {act.type === 'rated' && act.rating && <> <span className="text-green-700">{fmtRating(act.rating)}★</span></>}
        <p className="text-sm text-zinc-500">{fmtTileDate(act.createdAt)}</p>
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
        <select className="input w-auto py-1" value={chosen ?? ''} onChange={(e) => setTarget(e.target.value)} aria-label="Gigslist">
          {all.map((l) => <option key={l.gigslist.id} value={l.gigslist.id}>{l.gigslist.name}{saved.includes(l.gigslist.id) ? ' ✓' : ''}</option>)}
        </select>
      )}
      <button className="btn px-2 py-1" disabled={!chosen || isSaved || add.isPending} onClick={() => chosen && add.mutate({ gigslistId: chosen, gigId })}>
        {isSaved ? 'En Gigslist ✓' : add.isPending ? 'Guardando…' : '+ Gigslist'}
      </button>
      {add.isError && <span className="text-xs text-red-700">{(add.error as Error).message}</span>}
    </span>
  )
}
