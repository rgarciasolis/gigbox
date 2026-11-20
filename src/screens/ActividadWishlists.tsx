import { Link } from 'react-router-dom'
import { Async, GigList, GigRow, GoingButton, UserLink } from '@/components/ui'
import { relativeTime } from '@/domain/format'
import { useContactWishlistAdds } from '@/queries'

export function ActividadWishlists() {
  const q = useContactWishlistAdds()
  return (
    <div>
      <p>
        <Link to="/">Volver a Home</Link>
      </p>
      <h1>Conciertos añadidos a las Wishlists de tus contactos</h1>
      <Async query={q} isEmpty={(d) => d.length === 0} empty="Tus contactos no han añadido conciertos recientemente.">
        {(list) => (
          <GigList>
            {list.map((w) => (
              <GigRow
                key={w.user.id + w.gig.gig.id}
                s={w.gig}
                note={
                  <>
                    <UserLink user={w.user} /> lo añadió {relativeTime(w.addedAt)}
                  </>
                }
                actions={<GoingButton gig={w.gig} />}
              />
            ))}
          </GigList>
        )}
      </Async>
    </div>
  )
}
