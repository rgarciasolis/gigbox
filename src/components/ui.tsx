import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { UseQueryResult } from '@tanstack/react-query'
import type { GigSummary, ReviewView, User, UserSummary } from '@/domain/types'
import { formatDate, formatRating, lineup, relativeTime } from '@/domain/format'

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

/** Cuadrado de fecha del Figma: mes / dia / ano. */
export function DateSquare({ iso }: { iso: string }) {
  const d = new Date(iso)
  return (
    <div className="date-sq" aria-label={formatDate(iso)}>
      <span>{MONTHS[d.getMonth()]}</span>
      <b>{d.getDate()}</b>
      <span>{d.getFullYear()}</span>
    </div>
  )
}
import {
  useAddToWishlist,
  useFollow,
  useFollowArtist,
  useFollowedArtistIds,
  useRemoveFromWishlist,
  useSetLike,
  useToggleReviewLike,
  useUnfollow,
  useUnfollowArtist,
} from '@/queries'

// ---------------------------------------------------------------- Estados de carga

export function Loading({ label = 'Cargando...' }: { label?: string }) {
  return <p className="muted">{label}</p>
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const msg = error instanceof Error ? error.message : 'Ha ocurrido un error.'
  return (
    <div className="box" role="alert">
      <p>Error: {msg}</p>
      {onRetry && <button onClick={onRetry}>Reintentar</button>}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="muted">{children}</p>
}

/** Pinta los estados de una query (cargando, error, vacio) y delega los datos en children. */
export function Async<T>({
  query,
  isEmpty,
  empty,
  children,
}: {
  query: UseQueryResult<T>
  isEmpty?: (data: T) => boolean
  empty?: ReactNode
  children: (data: T) => ReactNode
}) {
  if (query.isPending) return <Loading />
  if (query.isError) return <ErrorBox error={query.error} onRetry={() => query.refetch()} />
  if (isEmpty?.(query.data)) return <Empty>{empty ?? 'No hay nada que mostrar.'}</Empty>
  return <>{children(query.data)}</>
}

export function MutationError({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <p role="alert">
      Error: {error instanceof Error ? error.message : 'No se pudo completar la accion.'}
    </p>
  )
}

// ---------------------------------------------------------------- Piezas pequenas

export function Avatar({ user, size = 40 }: { user: Pick<User, 'displayName'>; size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, lineHeight: `${size}px` }}
      className="inline-block shrink-0 rounded-full bg-[var(--zinc-200)] text-center font-bold"
    >
      {user.displayName.charAt(0).toUpperCase()}
    </span>
  )
}

export function Tabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="row" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export function UserLink({ user }: { user: Pick<User, 'id' | 'displayName'> }) {
  return <Link to={`/u/${user.id}`}>{user.displayName}</Link>
}

// ---------------------------------------------------------------- Acciones rapidas

export function LikeButton({ gig }: { gig: GigSummary }) {
  const like = useSetLike()
  return (
    <button
      aria-pressed={gig.likedByMe}
      disabled={like.isPending}
      onClick={() => like.mutate({ gigId: gig.gig.id, liked: !gig.likedByMe })}
    >
      {gig.likedByMe ? 'Quitar like' : 'Like'}
    </button>
  )
}

/** "Voy a ir": unica accion para guardar un concierto futuro en la Wishlist. */
export function GoingButton({ gig }: { gig: GigSummary }) {
  const add = useAddToWishlist()
  const remove = useRemoveFromWishlist()
  if (gig.isPast) return null
  const busy = add.isPending || remove.isPending
  return gig.inMyWishlist ? (
    <button disabled={busy} onClick={() => remove.mutate(gig.gig.id)}>
      Quitar de Wishlist
    </button>
  ) : (
    <button disabled={busy} onClick={() => add.mutate(gig.gig.id)}>
      Voy a ir
    </button>
  )
}

export function FollowButton({ userId, isFollowing }: { userId: string; isFollowing: boolean }) {
  const follow = useFollow()
  const unfollow = useUnfollow()
  const busy = follow.isPending || unfollow.isPending
  return isFollowing ? (
    <button disabled={busy} onClick={() => unfollow.mutate(userId)}>
      Dejar de seguir
    </button>
  ) : (
    <button disabled={busy} onClick={() => follow.mutate(userId)}>
      Seguir
    </button>
  )
}

export function FollowArtistButton({ artistId }: { artistId: string }) {
  const ids = useFollowedArtistIds()
  const follow = useFollowArtist()
  const unfollow = useUnfollowArtist()
  if (!ids.data) return null
  const busy = follow.isPending || unfollow.isPending
  return ids.data.includes(artistId) ? (
    <button disabled={busy} onClick={() => unfollow.mutate(artistId)}>
      Dejar de seguir
    </button>
  ) : (
    <button disabled={busy} onClick={() => follow.mutate(artistId)}>
      Seguir
    </button>
  )
}

// ---------------------------------------------------------------- Filas y tarjetas

/** Lugar del concierto: 📍 sala, ciudad. */
export function Venue({ gig, className }: { gig: GigSummary; className?: string }) {
  return (
    <div className={className}>
      <span aria-hidden>📍 </span>
      <Link to={`/salas/${gig.venue.id}`}>{gig.venue.name}</Link>, {gig.venue.city}
    </div>
  )
}

/** Fila de concierto (diseno del Home): fecha y datos a la izquierda, titulo grande y sala a la derecha. */
export function GigRow({
  s,
  actions,
  note,
}: {
  s: GigSummary
  actions?: ReactNode
  note?: ReactNode
}) {
  const status = [
    s.isPast ? `Nota media ${formatRating(s.avgRating)} · ${s.attendeeCount} asistentes` : null,
    s.attendedByMe ? 'Fui' : null,
    s.inMyWishlist ? 'En tu Wishlist' : null,
    s.likedByMe ? 'Like' : null,
  ].filter(Boolean)
  return (
    <li className="home-row">
      <div className="home-row__date">
        <DateSquare iso={s.gig.startsAt} />
      </div>
      <div className="home-row__meta">
        {note && <div className="muted">{note}</div>}
        {status.length > 0 && <div className="muted">{status.join(' · ')}</div>}
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

export function GigList({ children }: { children: ReactNode }) {
  return <ul className="m-0 list-none p-0">{children}</ul>
}

/** Resena (diseno del Home). Con `hideGig` solo muestra autor y texto (p. ej. dentro de la ficha del concierto). */
export function ReviewCard({
  r,
  footer,
  hideGig,
}: {
  r: ReviewView
  footer?: ReactNode
  hideGig?: boolean
}) {
  const like = useToggleReviewLike()
  const rating = r.attendance.rating !== null ? `Nota ${formatRating(r.attendance.rating)} / 5` : null
  return (
    <li className={`home-row home-row--review${hideGig ? ' home-row--nodate' : ''}`}>
      {!hideGig && (
        <div className="home-row__date">
          <DateSquare iso={r.gig.gig.startsAt} />
        </div>
      )}
      <div className="home-row__meta">
        <div className="text-xl leading-8">
          <UserLink user={r.user} />
        </div>
        <div className="muted">
          {relativeTime(r.attendance.createdAt)}
          {rating && ` · ${rating}`}
        </div>
        {!hideGig && <Venue gig={r.gig} className="muted" />}
      </div>
      <div className="home-row__body">
        {!hideGig && (
          <Link to={`/conciertos/${r.gig.gig.id}`} className="display-title">
            {lineup(r.gig.artists)}
          </Link>
        )}
        <p className={hideGig ? 'review-text !mt-0' : 'review-text'}>{r.attendance.review}</p>
        <div className="row mt-4 !gap-2">
          <button
            aria-pressed={r.likedByMe}
            disabled={like.isPending}
            className="!border-0 !bg-transparent !p-0 !normal-case"
            onClick={() => like.mutate({ attendanceId: r.attendance.id, liked: !r.likedByMe })}
          >
            {r.likedByMe ? '❤️' : '🤍'}
          </button>
          <span className="muted">{r.likeCount} Me gusta</span>
          {footer}
        </div>
      </div>
    </li>
  )
}

export function UserRow({ s }: { s: UserSummary }) {
  return (
    <li className="row py-3">
      <Avatar user={s.user} />
      <div className="grow">
        <UserLink user={s.user} />
        <div className="muted">
          @{s.user.username} · {s.user.city} · {s.concertsTotal} conciertos
        </div>
      </div>
      <FollowButton userId={s.user.id} isFollowing={s.isFollowing} />
    </li>
  )
}
