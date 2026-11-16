import { Link } from 'react-router-dom'
import { FriendAttendanceRow, ReviewCard } from '@/components/gig'
import { Async } from '@/components/ui'
import { useFriendsRecentConcerts, useMe, useReviews } from '@/data/hooks'

export default function HomePage() {
  const me = useMe()
  const concerts = useFriendsRecentConcerts(5)
  const reviews = useReviews('friends', 5)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Hola{me.data ? `, ${me.data.displayName.split(' ')[0]}` : ''}</h1>
        <p className="muted">Esto es lo último de la gente que sigues.</p>
      </div>
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="h1">Últimos conciertos logados de tus amigos</h2>
          <Link to="/perfil/friends" className="muted shrink-0 text-sm underline">Ver actividad</Link>
        </div>
        <Async query={concerts} empty="Tus amigos aún no han logado conciertos. Sigue a más gente desde Perfil → Friends.">
          {(list) => <div className="space-y-2">{list.map((v) => <FriendAttendanceRow key={v.attendance.id} v={v} />)}</div>}
        </Async>
      </section>
      <section>
        <h2 className="h1">Últimas reviews logadas de tus amigos</h2>
        <Async query={reviews} empty="Tus amigos aún no han escrito reviews.">
          {(list) => <div className="space-y-2">{list.map((r) => <ReviewCard key={r.attendance.id} r={r} />)}</div>}
        </Async>
      </section>
    </div>
  )
}
