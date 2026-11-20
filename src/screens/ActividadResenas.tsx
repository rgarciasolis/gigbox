import { Link } from 'react-router-dom'
import { Async } from '@/components/ui'
import { HomeReviewRow } from '@/components/home'
import { useContactReviews } from '@/queries'

export function ActividadResenas() {
  const q = useContactReviews()
  return (
    <div>
      <p>
        <Link to="/">Volver a Home</Link>
      </p>
      <h1>Reseñas de tus contactos</h1>
      <Async query={q} isEmpty={(d) => d.length === 0} empty="Tus contactos no han escrito reseñas recientemente.">
        {(list) => (
          <ul className="m-0 list-none p-0">
            {list.map((r) => (
              <HomeReviewRow key={r.attendance.id} r={r} />
            ))}
          </ul>
        )}
      </Async>
    </div>
  )
}
