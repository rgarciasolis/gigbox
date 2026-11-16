import { Link, useParams } from 'react-router-dom'
import { ActivityRow, GigCard } from '@/components/gig'
import { Async, Avatar, Empty } from '@/components/ui'
import { useFollow, useMe, useProfile, useUnfollow } from '@/data/hooks'

export default function ProfilePage() {
  const { userId } = useParams()
  const me = useMe()
  const id = userId ?? me.data?.id
  const profile = useProfile(id)
  const follow = useFollow()
  const unfollow = useUnfollow()
  return (
    <Async query={profile}>
      {(p) => (
        <div className="space-y-5">
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

          <section>
            <h2 className="h1">Favoritos</h2>
            {p.favorites.length === 0 ? <Empty>Aún no hay favoritos (notas de 4,5 o más).</Empty> : (
              <div className="space-y-2">{p.favorites.map((f) => <GigCard key={f.attendance.id} view={f.gig} />)}</div>
            )}
          </section>

          <section>
            <h2 className="h1">Actividad reciente</h2>
            {p.recentActivity.length === 0 ? <Empty>Sin actividad todavía. <Link className="underline" to="/gigs">Registra un concierto</Link>.</Empty> : (
              <ul className="divide-y divide-neutral-100">{p.recentActivity.map((a) => <ActivityRow key={a.activity.id} a={a} />)}</ul>
            )}
          </section>
        </div>
      )}
    </Async>
  )
}
