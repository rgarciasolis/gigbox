import { Link } from 'react-router-dom'
import type { ReviewView } from '@/domain/types'
import { lineup, relativeTime } from '@/domain/format'
import { DateSquare, GigRow, UserLink, Venue } from '@/components/ui'

// Filas del Home segun el artboard de Figma (01_Home): columna izquierda con fecha y datos,
// columna derecha con el titulo grande. En movil se apilan.

/** Concierto en una lista del Home: misma fila que el resto de listados. */
export const HomeGigRow = GigRow

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
