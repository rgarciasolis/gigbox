import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Async, Avatar, Empty, GigList, GigRow, MutationError } from '@/components/ui'
import { formatDate } from '@/domain/format'
import { useCurrentUser, useFavoriteIds, useMyAttendances, useProfile, useSetFavorites } from '@/queries'

export function PerfilResumen() {
  const me = useCurrentUser()
  return (
    <Async query={me}>{(u) => <Resumen userId={u.id} />}</Async>
  )
}

function Resumen({ userId }: { userId: string }) {
  const q = useProfile(userId)
  const [editing, setEditing] = useState(false)
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
          <p className="muted">
            {p.stats.concertsTotal} conciertos ({p.stats.concertsThisYear} este año) · {p.stats.artists} artistas ·{' '}
            {p.stats.venues} salas · {p.stats.cities} ciudades ·{' '}
            <Link to="/perfil/siguiendo">{p.stats.following} siguiendo</Link> ·{' '}
            <Link to="/perfil/seguidores">{p.stats.followers} le siguen</Link>
          </p>
          <p>
            <Link to="/personas">Buscar personas</Link>
          </p>

          <h2>Favoritos</h2>
          {editing ? (
            <FavoritesEditor onDone={() => setEditing(false)} />
          ) : (
            <>
              {p.favorites.length === 0 ? (
                <Empty>Todavía no has elegido favoritos.</Empty>
              ) : (
                <GigList>
                  {p.favorites.map((s) => (
                    <GigRow key={s.gig.id} s={s} />
                  ))}
                </GigList>
              )}
              <button onClick={() => setEditing(true)}>Editar favoritos</button>
            </>
          )}

          <h2>Últimos conciertos</h2>
          {p.latest.length === 0 ? (
            <Empty>Todavía no has registrado conciertos.</Empty>
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
                    ? 'Voy a ir a'
                    : a.activity.type === 'review'
                      ? 'Reseñé'
                      : 'Fui a'}{' '}
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

const MAX_FAVORITES = 5

function FavoritesEditor({ onDone }: { onDone: () => void }) {
  const ids = useFavoriteIds()
  const att = useMyAttendances()
  const save = useSetFavorites()
  const [selected, setSelected] = useState<string[] | null>(null)
  const current = selected ?? ids.data ?? []

  return (
    <div className="box">
      <p className="muted">Elige hasta {MAX_FAVORITES} conciertos de tu histórico.</p>
      <Async query={att} isEmpty={(d) => d.length === 0} empty="Aún no tienes conciertos en tu histórico.">
        {(list) => (
          <ul className="m-0 list-none p-0">
            {list.map((a) => {
              const checked = current.includes(a.gig.gig.id)
              return (
                <li key={a.attendance.id}>
                  <label style={{ fontWeight: 400 }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!checked && current.length >= MAX_FAVORITES}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...current, a.gig.gig.id]
                            : current.filter((x) => x !== a.gig.gig.id),
                        )
                      }
                    />{' '}
                    {a.gig.artists.map((x) => x.name).join(', ')} · {formatDate(a.gig.gig.startsAt)}
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </Async>
      <div className="row mt-2">
        <button
          
          disabled={save.isPending || selected === null}
          onClick={() => save.mutate(current, { onSuccess: onDone })}
        >
          Guardar
        </button>
        <button onClick={onDone}>Cancelar</button>
      </div>
      <MutationError error={save.error} />
    </div>
  )
}
