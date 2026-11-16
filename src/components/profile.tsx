// Componentes compartidos entre mi perfil (/perfil) y perfiles ajenos (/u/:id).
import { GigCard, ReviewCard } from '@/components/gig'
import { Avatar, Empty } from '@/components/ui'
import { useFollow, useUnfollow } from '@/data/hooks'
import type { ProfileView } from '@/domain/views'

export function ProfileHeader({ p }: { p: ProfileView }) {
  const follow = useFollow()
  const unfollow = useUnfollow()
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Avatar user={p.user} size={64} />
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{p.user.displayName}</h1>
          <p className="muted">@{p.user.handle} · {p.user.city}</p>
          <p className="mt-1 text-sm">{p.user.bio}</p>
          <p className="muted mt-1">{p.followers} seguidores · {p.following} siguiendo{!p.isMe && p.sharedGigs > 0 ? ` · ${p.sharedGigs} gigs en común contigo` : ''}</p>
        </div>
        {!p.isMe && (
          <button className="btn" disabled={follow.isPending || unfollow.isPending}
            onClick={() => (p.isFollowing ? unfollow.mutate(p.user.id) : follow.mutate(p.user.id))}>
            {p.isFollowing ? 'Dejar de seguir' : 'Seguir'}
          </button>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[['Conciertos', p.stats.gigs], ['Artistas', p.stats.artists], ['Salas', p.stats.venues], ['Ciudades', p.stats.cities]].map(([l, v]) => (
          <div key={l} className="card text-center"><dd className="text-2xl font-semibold">{v}</dd><dt className="muted">{l}</dt></div>
        ))}
      </dl>
    </div>
  )
}

export function ProfileOverview({ p }: { p: ProfileView }) {
  return (
    <div className="space-y-5">
      <section>
        <h2 className="h1">{p.isMe ? 'Mis 5 favoritos' : 'Sus 5 favoritos'}</h2>
        {p.favorites.length === 0 ? <Empty>Aún no hay favoritos (notas de 4,5 o más).</Empty> : (
          <div className="space-y-2">{p.favorites.map((f) => <GigCard key={f.attendance.id} view={f.gig} />)}</div>
        )}
      </section>
      <section>
        <h2 className="h1">Actividad reciente</h2>
        <p className="muted mb-2 -mt-2 text-sm">Últimos conciertos logados{p.isMe ? '' : ` por ${p.user.displayName}`}</p>
        {p.recentGigs.length === 0 ? <Empty>{p.isMe ? 'Aún no has registrado conciertos.' : 'Todavía no ha registrado conciertos.'}</Empty> : (
          <div className="space-y-2">{p.recentGigs.map((a) => <GigCard key={a.attendance.id} view={a.gig} />)}</div>
        )}
      </section>
      <section>
        <h2 className="h1">Reviews recientes</h2>
        {p.recentReviews.length === 0 ? <Empty>{p.isMe ? 'Aún no has escrito reviews.' : 'Todavía no ha escrito reviews.'}</Empty> : (
          <div className="space-y-2">{p.recentReviews.map((r) => <ReviewCard key={r.attendance.id} r={r} />)}</div>
        )}
      </section>
    </div>
  )
}
