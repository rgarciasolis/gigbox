import { Link } from 'react-router-dom'
import { Async, Empty, GigList, GoingButton, UserLink } from '@/components/ui'
import { HomeGigRow, HomeReviewRow } from '@/components/home'
import { relativeTime } from '@/domain/format'
import { useHomeFeed } from '@/queries'

export function Home() {
  const feed = useHomeFeed()
  return (
    <div>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <Link to="/personas" className="see-all">
          Buscar personas
        </Link>
      </div>
      <Async query={feed}>
        {(f) =>
          f.mode === 'contacts' ? (
            <>
              <div className="section-head">
                <h2>Últimos conciertos añadidos a las Wishlists de tus contactos</h2>
                {f.moreWishlistAdds && (
                  <Link to="/actividad/wishlists" className="see-all see-all--desktop">
                    Ver todo
                  </Link>
                )}
              </div>
              {f.wishlistAdds.length === 0 ? (
                <Empty>Tus contactos no han añadido conciertos recientemente.</Empty>
              ) : (
                <GigList>
                  {f.wishlistAdds.map((w) => (
                    <HomeGigRow
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
              {f.moreWishlistAdds && (
                <Link to="/actividad/wishlists" className="btn-block">
                  Ver más
                </Link>
              )}
              <div className="section-head">
                <h2>ÚLTIMAS RESEÑAS DE TUS CONTACTOS</h2>
                {f.moreReviews && (
                  <Link to="/actividad/resenas" className="see-all see-all--desktop">
                    Ver todo
                  </Link>
                )}
              </div>
              {f.reviews.length === 0 ? (
                <Empty>Tus contactos no han escrito reseñas recientemente.</Empty>
              ) : (
                <ul className="m-0 list-none p-0">
                  {f.reviews.map((r) => (
                    <HomeReviewRow key={r.attendance.id} r={r} />
                  ))}
                </ul>
              )}
              {f.moreReviews && (
                <Link to="/actividad/resenas" className="btn-block">
                  Ver más
                </Link>
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
                    <HomeGigRow key={g.gig.id} s={g} actions={<GoingButton gig={g} />} />
                  ))}
                </GigList>
              )}
              <h2>Wishlist de {f.city}</h2>
              {f.wishlistOfCity.length === 0 ? (
                <Empty>Aún no hay conciertos guardados en tu ciudad.</Empty>
              ) : (
                <GigList>
                  {f.wishlistOfCity.map((g) => (
                    <HomeGigRow
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
