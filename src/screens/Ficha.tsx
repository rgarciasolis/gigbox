import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Async,
  Empty,
  FollowArtistButton,
  GoingButton,
  LikeButton,
  MutationError,
  ReviewCard,
  UserLink,
} from '@/components/ui'
import { RATING_STEPS, formatDateTime, formatRating, lineup } from '@/domain/format'
import type { GigDetail, TicketStatus } from '@/domain/types'
import {
  useAddToList,
  useDeleteReview,
  useGig,
  useLists,
  useMarkAttended,
  useRemoveFromList,
  useSetTicketStatus,
  useTags,
  useUnmarkAttended,
  useUpdateAttendance,
} from '@/queries'

export function Ficha() {
  const { id = '' } = useParams()
  const q = useGig(id)
  return (
    <Async query={q}>
      {(d) => (
        <div>
          <p>
            <Link to="/conciertos">Volver a Conciertos</Link>
          </p>
          <h1>{lineup(d.artists)}</h1>
          <p>
            {formatDateTime(d.gig.startsAt)}
            <br />
            <Link to={`/salas/${d.venue.id}`}>{d.venue.name}</Link>, {d.venue.address}, {d.venue.city} (
            {d.venue.country})
          </p>
          <div
            aria-label="Sin imagen"
            className="box muted flex items-center justify-center"
            style={{ height: 120 }}
          >
            Sin imagen
          </div>
          <p className="mt-3">
            {d.isPast ? (
              <>
                Nota media: <strong>{formatRating(d.avgRating)}</strong> · {d.attendeeCount} asistentes
              </>
            ) : (
              'Concierto futuro'
            )}
          </p>

          <h2>Cartel</h2>
          <ul className="m-0 list-none p-0">
            {d.artists.map((a) => (
              <li key={a.id} className="row border-b border-gray-300 py-2">
                <span className="grow">
                  {a.name} <span className="muted text-sm">· {a.genre}</span>
                </span>
                <FollowArtistButton artistId={a.id} />
              </li>
            ))}
          </ul>

          <h2>Tus acciones</h2>
          <div className="row">
            <LikeButton gig={d} />
            <GoingButton gig={d} />
          </div>
          {d.isPast ? <PastActions d={d} /> : <FutureActions d={d} />}
          <ListsPicker d={d} />

          <h2>{d.isPast ? 'Amigos que fueron' : 'Amigos que van'}</h2>
          {d.contacts.length === 0 ? (
            <Empty>Ninguno de tus contactos {d.isPast ? 'fue' : 'lo tiene en su Wishlist'}.</Empty>
          ) : (
            <ul>
              {d.contacts.map((c) => (
                <li key={c.user.id}>
                  <UserLink user={c.user} />
                </li>
              ))}
            </ul>
          )}

          <h2>Reseñas ({d.reviews.length})</h2>
          {d.reviews.length === 0 ? (
            <Empty>Todavía no hay reseñas.</Empty>
          ) : (
            <ul className="m-0 list-none p-0">
              {d.reviews.map((r) => (
                <ReviewCard key={r.attendance.id} r={r} />
              ))}
            </ul>
          )}
        </div>
      )}
    </Async>
  )
}

function FutureActions({ d }: { d: GigDetail }) {
  const setStatus = useSetTicketStatus()
  if (!d.inMyWishlist) return <p className="muted">Pulsa Voy a ir para guardarlo en tu Wishlist.</p>
  return (
    <div className="mt-2">
      <label htmlFor="ticket">Estado de entrada</label>
      <select
        id="ticket"
        value={d.myTicketStatus ?? 'no_ticket'}
        disabled={setStatus.isPending}
        onChange={(e) => setStatus.mutate({ gigId: d.gig.id, status: e.target.value as TicketStatus })}
      >
        <option value="no_ticket">No tengo entrada</option>
        <option value="has_ticket">Tengo entrada</option>
      </select>
      <MutationError error={setStatus.error} />
    </div>
  )
}

function PastActions({ d }: { d: GigDetail }) {
  const mark = useMarkAttended()
  const unmark = useUnmarkAttended()
  const att = d.myAttendance
  return (
    <div className="mt-3">
      {att ? (
        <>
          <p>
            <strong>Fui.</strong>{' '}
            <button disabled={unmark.isPending} onClick={() => unmark.mutate(d.gig.id)}>
              Quitar Fui
            </button>
          </p>
          <MutationError error={unmark.error} />
          <AttendanceForm key={att.id} d={d} />
        </>
      ) : (
        <>
          <button className="primary" disabled={mark.isPending} onClick={() => mark.mutate(d.gig.id)}>
            Fui
          </button>
          <MutationError error={mark.error} />
        </>
      )}
    </div>
  )
}

function AttendanceForm({ d }: { d: GigDetail }) {
  const att = d.myAttendance!
  const update = useUpdateAttendance()
  const delReview = useDeleteReview()
  const tags = useTags()
  const [review, setReview] = useState(att.review ?? '')
  const [photoError, setPhotoError] = useState<string | null>(null)
  const patch = (p: Parameters<typeof update.mutate>[0]['patch']) =>
    update.mutate({ gigId: d.gig.id, patch: p })

  return (
    <div className="box">
      <label htmlFor="rating">Tu nota</label>
      <select
        id="rating"
        value={att.rating ?? ''}
        onChange={(e) => patch({ rating: e.target.value ? Number(e.target.value) : null })}
      >
        <option value="">Sin nota</option>
        {RATING_STEPS.map((r) => (
          <option key={r} value={r}>
            {formatRating(r)}
          </option>
        ))}
      </select>

      <label htmlFor="review">Tu reseña</label>
      <textarea id="review" value={review} onChange={(e) => setReview(e.target.value)} />
      <div className="row mt-1">
        <button
          className="primary"
          disabled={update.isPending || review === (att.review ?? '')}
          onClick={() => patch({ review })}
        >
          Guardar reseña
        </button>
        {att.review && (
          <button
            disabled={delReview.isPending}
            onClick={() => {
              delReview.mutate(d.gig.id)
              setReview('')
            }}
          >
            Eliminar reseña
          </button>
        )}
      </div>

      <label>Tags</label>
      <Async query={tags} isEmpty={(t) => t.length === 0} empty="Aún no tienes tags. Créalos en Perfil > Tags.">
        {(list) => (
          <div className="row">
            {list.map((t) => (
              <label key={t.id} style={{ display: 'inline-flex', gap: 4, fontWeight: 400, margin: 0 }}>
                <input
                  type="checkbox"
                  checked={att.tagIds.includes(t.id)}
                  onChange={(e) =>
                    patch({
                      tagIds: e.target.checked
                        ? [...att.tagIds, t.id]
                        : att.tagIds.filter((x) => x !== t.id),
                    })
                  }
                />
                {t.name}
              </label>
            ))}
          </div>
        )}
      </Async>

      <label htmlFor="photo">Foto (simulada, se guarda solo en este navegador)</label>
      {att.photoUrl && (
        <p>
          <img src={att.photoUrl} alt="Tu foto del concierto" style={{ maxWidth: '100%', maxHeight: 240 }} />
          <br />
          <button onClick={() => patch({ photoUrl: null })}>Quitar foto</button>
        </p>
      )}
      <input
        id="photo"
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          if (file.size > 400 * 1024) {
            setPhotoError('La foto es demasiado grande para el MVP (máximo 400 KB).')
            return
          }
          setPhotoError(null)
          const reader = new FileReader()
          reader.onload = () => patch({ photoUrl: String(reader.result) })
          reader.readAsDataURL(file)
        }}
      />
      {photoError && <p role="alert">{photoError}</p>}
      <MutationError error={update.error ?? delReview.error} />
    </div>
  )
}

function ListsPicker({ d }: { d: GigDetail }) {
  const lists = useLists()
  const add = useAddToList()
  const remove = useRemoveFromList()
  const [listId, setListId] = useState('')
  return (
    <div className="mt-3">
      <label htmlFor="list">Añadir a una lista</label>
      <Async query={lists} isEmpty={(l) => l.length === 0} empty={<>No tienes listas. <Link to="/perfil/listas">Crear una lista</Link></>}>
        {(all) => {
          const inLists = all.filter((l) => d.myListIds.includes(l.id))
          const available = all.filter((l) => !d.myListIds.includes(l.id))
          return (
            <>
              <div className="row">
                <select id="list" value={listId} onChange={(e) => setListId(e.target.value)}>
                  <option value="">Elige una lista</option>
                  {available.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
                <button
                  disabled={!listId || add.isPending}
                  onClick={() => {
                    add.mutate({ listId, gigId: d.gig.id })
                    setListId('')
                  }}
                >
                  Añadir
                </button>
              </div>
              {inLists.length > 0 && (
                <ul>
                  {inLists.map((l) => (
                    <li key={l.id}>
                      En <Link to={`/listas/${l.id}`}>{l.title}</Link>{' '}
                      <button
                        className="link"
                        disabled={remove.isPending}
                        onClick={() => remove.mutate({ listId: l.id, gigId: d.gig.id })}
                      >
                        quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <MutationError error={add.error ?? remove.error} />
            </>
          )
        }}
      </Async>
    </div>
  )
}
