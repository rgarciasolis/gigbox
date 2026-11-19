import { Navigate, useParams } from 'react-router-dom'
import { Async, Avatar, Empty, FollowButton, GigList, GigRow } from '@/components/ui'
import { formatDate } from '@/domain/format'
import { useProfile } from '@/queries'
import { Link } from 'react-router-dom'

export function PerfilPublico() {
  const { id = '' } = useParams()
  const q = useProfile(id)
  if (q.data?.isMe) return <Navigate to="/perfil" replace />
  return (
    <Async query={q}>
      {(p) => (
        <div>
          <div className="row">
            <Avatar user={p.user} size={56} />
            <div>
              <h1 style={{ margin: 0 }}>{p.user.displayName}</h1>
              <div className="muted">
                @{p.user.username} · {p.user.city}
              </div>
            </div>
          </div>
          <p>{p.user.bio}</p>
          <FollowButton userId={p.user.id} isFollowing={p.isFollowing} />
          <p className="muted">
            {p.stats.concertsTotal} conciertos · {p.stats.artists} artistas · {p.stats.venues} salas ·{' '}
            {p.stats.following} siguiendo · {p.stats.followers} seguidores
          </p>

          <h2>Favoritos</h2>
          {p.favorites.length === 0 ? (
            <Empty>Sin favoritos.</Empty>
          ) : (
            <GigList>
              {p.favorites.map((s) => (
                <GigRow key={s.gig.id} s={s} />
              ))}
            </GigList>
          )}

          <h2>Últimos conciertos</h2>
          {p.latest.length === 0 ? (
            <Empty>Todavía no ha registrado conciertos.</Empty>
          ) : (
            <GigList>
              {p.latest.map((s) => (
                <GigRow key={s.gig.id} s={s} />
              ))}
            </GigList>
          )}

          <h2>Actividad reciente</h2>
          {p.recentActivity.length === 0 ? (
            <Empty>Sin actividad.</Empty>
          ) : (
            <ul>
              {p.recentActivity.map((a) => (
                <li key={a.activity.id}>
                  {a.activity.type === 'wishlist_add'
                    ? 'Va a ir a'
                    : a.activity.type === 'review'
                      ? 'Reseñó'
                      : 'Fue a'}{' '}
                  <Link to={`/conciertos/${a.gig.gig.id}`}>{a.gig.artists.map((x) => x.name).join(', ')}</Link>{' '}
                  <span className="muted">({formatDate(a.activity.createdAt)})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Async>
  )
}
