import { Link } from 'react-router-dom'
import { Async, Empty, GigList, GigRow, GoingButton, ReviewCard, UserLink } from '@/components/ui'
import { relativeTime } from '@/domain/format'
import { useHomeFeed } from '@/queries'

export function Home() {
  const feed = useHomeFeed()
  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Home</h1>
        <Link to="/personas">Buscar personas</Link>
      </div>
      <Async query={feed}>
        {(f) =>
          f.mode === 'contacts' ? (
            <>
              <h2>Últimos conciertos añadidos a las Wishlists de tus contactos</h2>
              {f.wishlistAdds.length === 0 ? (
                <Empty>Tus contactos no han añadido conciertos recientemente.</Empty>
              ) : (
                <GigList>
                  {f.wishlistAdds.map((w) => (
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
              <h2>Últimas reseñas de tus contactos</h2>
              {f.reviews.length === 0 ? (
                <Empty>Tus contactos no han escrito reseñas recientemente.</Empty>
              ) : (
                <ul className="m-0 list-none p-0">
                  {f.reviews.map((r) => (
                    <ReviewCard key={r.attendance.id} r={r} />
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <p>
                Todavía no sigues a nadie. Mientras tanto, te mostramos novedades de {f.city}.{' '}
                <Link to="/personas">Buscar personas</Link>
              </p>
              <h2>Últimos conciertos añadidos en {f.city}</h2>
              {f.latestInCity.length === 0 ? (
                <Empty>No hay conciertos nuevos en tu ciudad.</Empty>
              ) : (
                <GigList>
                  {f.latestInCity.map((g) => (
                    <GigRow key={g.gig.id} s={g} actions={<GoingButton gig={g} />} />
                  ))}
                </GigList>
              )}
              <h2>Wishlist de {f.city}</h2>
              {f.wishlistOfCity.length === 0 ? (
                <Empty>Aún no hay conciertos guardados en tu ciudad.</Empty>
              ) : (
                <GigList>
                  {f.wishlistOfCity.map((g) => (
                    <GigRow
                      key={g.gig.id}
                      s={g}
                      note={`${g.saves} personas lo tienen en su Wishlist`}
                      actions={<GoingButton gig={g} />}
                    />
                  ))}
                </GigList>
              )}
            </>
          )
        }
      </Async>
    </div>
  )
}
