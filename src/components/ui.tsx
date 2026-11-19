import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { UseQueryResult } from '@tanstack/react-query'
import type { GigSummary, ReviewView, User, UserSummary } from '@/domain/types'
import { formatDate, formatRating, lineup, relativeTime } from '@/domain/format'
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
      className="inline-block shrink-0 rounded-full bg-gray-300 text-center font-bold"
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
          className={o.value === value ? 'primary' : ''}
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
    <button className="primary" disabled={busy} onClick={() => follow.mutate(userId)}>
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

export function GigRow({
  s,
  actions,
  note,
}: {
  s: GigSummary
  actions?: ReactNode
  note?: ReactNode
}) {
  return (
    <li className="border-b border-gray-300 py-3">
      <div>
        <Link to={`/conciertos/${s.gig.id}`} className="font-bold">
          {lineup(s.artists)}
        </Link>
      </div>
      <div>
        {formatDate(s.gig.startsAt)} · <Link to={`/salas/${s.venue.id}`}>{s.venue.name}</Link>,{' '}
        {s.venue.city}
      </div>
      <div className="muted text-sm">
        {s.isPast
          ? `Nota media ${formatRating(s.avgRating)} · ${s.attendeeCount} asistentes`
          : 'Próximo'}
        {s.attendedByMe && ' · Fui'}
        {s.inMyWishlist && ' · En tu Wishlist'}
        {s.likedByMe && ' · Like'}
      </div>
      {note && <div className="text-sm">{note}</div>}
      {actions && <div className="row mt-2">{actions}</div>}
    </li>
  )
}

export function GigList({ children }: { children: ReactNode }) {
  return <ul className="m-0 list-none p-0">{children}</ul>
}

export function ReviewCard({ r, footer }: { r: ReviewView; footer?: ReactNode }) {
  const like = useToggleReviewLike()
  return (
    <li className="border-b border-gray-300 py-3">
      <div>
        <UserLink user={r.user} /> · {relativeTime(r.attendance.createdAt)}
      </div>
      <div>
        <Link to={`/conciertos/${r.gig.gig.id}`} className="font-bold">
          {lineup(r.gig.artists)}
        </Link>{' '}
        · {formatDate(r.gig.gig.startsAt)} · {r.gig.venue.city}
      </div>
      {r.attendance.rating !== null && <div>Nota: {formatRating(r.attendance.rating)} / 5</div>}
      <p className="my-1">{r.attendance.review}</p>
      <div className="row">
        <button
          aria-pressed={r.likedByMe}
          disabled={like.isPending}
          onClick={() => like.mutate({ attendanceId: r.attendance.id, liked: !r.likedByMe })}
        >
          {r.likedByMe ? 'Quitar like' : 'Like'}
        </button>
        <span className="muted text-sm">{r.likeCount} likes</span>
        {footer}
      </div>
    </li>
  )
}

export function UserRow({ s }: { s: UserSummary }) {
  return (
    <li className="row border-b border-gray-300 py-3">
      <Avatar user={s.user} />
      <div className="grow">
        <UserLink user={s.user} />
        <div className="muted text-sm">
          @{s.user.username} · {s.user.city} · {s.concertsTotal} conciertos
        </div>
      </div>
      <FollowButton userId={s.user.id} isFollowing={s.isFollowing} />
    </li>
  )
}
