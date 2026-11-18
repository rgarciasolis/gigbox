// Componentes compartidos entre mi perfil (/perfil) y perfiles ajenos (/u/:id).
import { GigCard, GigGrid, ReviewCard, ReviewGrid } from '@/components/gig'
import { Avatar, Empty, SectionHeader } from '@/components/ui'
import { useFollow, useUnfollow } from '@/data/hooks'
import type { ProfileView } from '@/domain/views'

export function ProfileHeader({ p }: { p: ProfileView }) {
  const follow = useFollow()
  const unfollow = useUnfollow()
  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <Avatar user={p.user} size={72} />
        <h1 className="font-heading text-5xl font-bold italic text-zinc-500">{p.user.displayName}</h1>
        <p className="text-sm uppercase text-zinc-950">@{p.user.handle} · {p.user.city}</p>
        <p className="max-w-xl text-lg text-zinc-800">{p.user.bio}</p>
        <p className="text-sm text-zinc-500">{p.followers} seguidores · {p.following} siguiendo{!p.isMe && p.sharedGigs > 0 ? ` · ${p.sharedGigs} gigs en común contigo` : ''}</p>
        {!p.isMe && (
          <button className="btn btn-primary mt-1 px-8 py-3" disabled={follow.isPending || unfollow.isPending}
            onClick={() => (p.isFollowing ? unfollow.mutate(p.user.id) : follow.mutate(p.user.id))}>
            {p.isFollowing ? 'Dejar de seguir' : 'Seguir'}
          </button>
        )}
      </div>
      <dl className="mx-auto grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
        {[['Conciertos', p.stats.gigs], ['Artistas', p.stats.artists], ['Salas', p.stats.venues], ['Ciudades', p.stats.cities]].map(([l, v]) => (
          <div key={l} className="overflow-hidden rounded bg-green-50">
            <dd className="pt-3 font-heading text-4xl font-bold text-[#151515]">{v}</dd>
            <dt className="mt-2 bg-green-950 px-2 py-[5px] text-xs uppercase text-green-50">{l}</dt>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function ProfileOverview({ p }: { p: ProfileView }) {
  return (
    <div className="space-y-14">
      <section>
        <SectionHeader eyebrow="Lo mejor de su diario" title={p.isMe ? 'Mis 5 favoritos' : 'Sus 5 favoritos'} />
        {p.favorites.length === 0 ? <Empty>Aún no hay favoritos (notas de 4,5 o más).</Empty> : (
          <GigGrid>{p.favorites.map((f) => <GigCard key={f.attendance.id} view={f.gig} />)}</GigGrid>
        )}
      </section>
      <section>
        <SectionHeader eyebrow={`Últimos conciertos logados${p.isMe ? '' : ` por ${p.user.displayName}`}`} title="Actividad reciente" />
        {p.recentGigs.length === 0 ? <Empty>{p.isMe ? 'Aún no has registrado conciertos.' : 'Todavía no ha registrado conciertos.'}</Empty> : (
          <GigGrid>{p.recentGigs.map((a) => <GigCard key={a.attendance.id} view={a.gig} />)}</GigGrid>
        )}
      </section>
      <section>
        <SectionHeader eyebrow="The words as read" title="Reviews recientes" />
        {p.recentReviews.length === 0 ? <Empty>{p.isMe ? 'Aún no has escrito reviews.' : 'Todavía no ha escrito reviews.'}</Empty> : (
          <ReviewGrid>{p.recentReviews.map((r) => <ReviewCard key={r.attendance.id} r={r} />)}</ReviewGrid>
        )}
      </section>
    </div>
  )
}
