import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { GigSummary, ReviewView } from '@/domain/types'
import { lineup, relativeTime } from '@/domain/format'
import { DateSquare, UserLink } from '@/components/ui'

// Filas del Home segun el artboard de Figma (01_Home): columna izquierda con fecha y datos,
// columna derecha con el titulo grande. En movil se apilan.

function Venue({ gig, className }: { gig: GigSummary; className?: string }) {
  return (
    <div className={className}>
      <span aria-hidden>📍 </span>
      <Link to={`/salas/${gig.venue.id}`}>{gig.venue.name}</Link>, {gig.venue.city}
    </div>
  )
}

/** Concierto en una lista del Home: fecha, quien lo guardo y accion a la izquierda; titulo y sala a la derecha. */
export function HomeGigRow({ s, note, actions }: { s: GigSummary; note?: ReactNode; actions?: ReactNode }) {
  return (
    <li className="home-row">
      <div className="home-row__date">
        <DateSquare iso={s.gig.startsAt} />
      </div>
      <div className="home-row__meta">
        {note && <div className="muted">{note}</div>}
        {actions && <div className="row">{actions}</div>}
      </div>
      <div className="home-row__body">
        <Link to={`/conciertos/${s.gig.id}`} className="display-title">
          {lineup(s.artists)}
        </Link>
        <Venue gig={s} className="mt-2 text-base leading-6 text-[var(--zinc-500)]" />
      </div>
    </li>
  )
}

/** Resena en una lista del Home: autor, tiempo y sala a la izquierda; titulo y texto a la derecha. */
export function HomeReviewRow({ r }: { r: ReviewView }) {
  return (
    <li className="home-row home-row--review">
      <div className="home-row__date">
        <DateSquare iso={r.gig.gig.startsAt} />
      </div>
      <div className="home-row__meta">
        <div className="text-xl leading-8">
          <UserLink user={r.user} />
        </div>
        <div className="muted">{relativeTime(r.attendance.createdAt)}</div>
        <Venue gig={r.gig} className="muted" />
      </div>
      <div className="home-row__body">
        <Link to={`/conciertos/${r.gig.gig.id}`} className="display-title">
          {lineup(r.gig.artists)}
        </Link>
        <p className="review-text">{r.attendance.review}</p>
      </div>
    </li>
  )
}
