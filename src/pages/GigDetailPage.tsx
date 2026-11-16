import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AddToGigslist, ReviewCard } from '@/components/gig'
import { Async, Avatar, Empty, Rating, RatingInput } from '@/components/ui'
import { useCreateTag, useGig, useRemoveAttendance, useTags, useUpsertAttendance } from '@/data/hooks'
import type { GigDetail } from '@/domain/views'
import { fmtDateLong } from '@/lib'

function MyPanel({ g }: { g: GigDetail }) {
  const up = useUpsertAttendance()
  const rm = useRemoveAttendance()
  const tags = useTags()
  const createTag = useCreateTag()
  const mine = g.mine
  const [review, setReview] = useState(mine?.review ?? '')
  const [newTag, setNewTag] = useState('')
  useEffect(() => setReview(mine?.review ?? ''), [mine?.review])
  const gigId = g.gig.id
  const err = up.error ?? rm.error ?? createTag.error
  return (
    <section className="card space-y-3">
      <h2 className="font-medium">Mi registro</h2>
      <div className="flex flex-wrap gap-2">
        {!mine || mine.status !== 'attended' ? (
          <button className="btn btn-primary" disabled={up.isPending} onClick={() => up.mutate({ gigId, status: 'attended' })}>
            {g.isUpcoming ? 'Ya fui' : 'Asistí'}
          </button>
        ) : <span className="rounded bg-neutral-100 px-2 py-1 text-sm">Asistí ✓</span>}
        {g.isUpcoming && (!mine || mine.status !== 'going') && (
          <button className="btn" disabled={up.isPending} onClick={() => up.mutate({ gigId, status: 'going' })}>Voy a ir</button>
        )}
        {mine && <button className="btn" disabled={rm.isPending} onClick={() => rm.mutate(gigId)}>Quitar de mi registro</button>}
        <AddToGigslist gigId={gigId} />
      </div>
      {mine?.status === 'attended' ? (
        <>
          <div><p className="muted mb-1">Nota</p><RatingInput value={mine.rating} disabled={up.isPending} onChange={(v) => up.mutate({ gigId, rating: v })} /></div>
          <div>
            <p className="muted mb-1">Reseña</p>
            <textarea className="input" rows={3} value={review} onChange={(e) => setReview(e.target.value)} placeholder="¿Qué tal estuvo?" />
            <button className="btn mt-1" disabled={up.isPending || review === (mine.review ?? '')} onClick={() => up.mutate({ gigId, review })}>Guardar reseña</button>
          </div>
          <div>
            <p className="muted mb-1">Tags</p>
            <div className="flex flex-wrap gap-2">
              {tags.data?.map(({ tag }) => {
                const on = mine.tagIds.includes(tag.id)
                return (
                  <button key={tag.id} className={`rounded-full border px-2 py-0.5 text-xs ${on ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300'}`}
                    onClick={() => up.mutate({ gigId, tagIds: on ? mine.tagIds.filter((i) => i !== tag.id) : [...mine.tagIds, tag.id] })}>{tag.name}</button>
                )
              })}
            </div>
            <form className="mt-2 flex gap-1" onSubmit={async (e) => {
              e.preventDefault()
              if (!newTag.trim()) return
              const t = await createTag.mutateAsync(newTag)
              await up.mutateAsync({ gigId, tagIds: [...new Set([...mine.tagIds, t.id])] })
              setNewTag('')
            }}>
              <input className="input" placeholder="Nuevo tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
              <button className="btn">Añadir</button>
            </form>
          </div>
        </>
      ) : <p className="muted">Marca que asististe para puntuar, reseñar y etiquetar.</p>}
      {err && <p className="text-sm text-red-700" role="alert">{(err as Error).message}</p>}
    </section>
  )
}

export default function GigDetailPage() {
  const { gigId = '' } = useParams()
  const q = useGig(gigId)
  return (
    <Async query={q}>
      {(g) => (
        <div className="space-y-5">
          <div>
            <p className="muted"><Link to="/gigs" className="underline">Gigs</Link> / ficha</p>
            <h1 className="text-xl font-semibold">{g.gig.title}</h1>
            <p className="text-sm">{fmtDateLong(g.gig.date)}</p>
            <p className="text-sm">
              <span className="muted" title="Asistencias registradas en Gigbox, no el aforo del recinto">Asistieron:</span> {g.attendeeCount} {g.attendeeCount === 1 ? 'persona' : 'personas'}
              {g.friendsAttended.length > 0 && <span className="muted"> · {g.friendsAttended.length} {g.friendsAttended.length === 1 ? 'amigo tuyo fue' : 'amigos tuyos fueron'}</span>}
            </p>
            <p className="text-sm">{g.venue.name}, {g.venue.city} ({g.venue.country})</p>
            <p className="mt-1 text-sm"><span className="muted">Cartel:</span> {g.artists.map((a) => `${a.name} (${a.genre})`).join(' · ')}</p>
            <p className="mt-1 text-sm">{g.avgRating !== null ? <><Rating value={Math.round(g.avgRating * 2) / 2} /> <span className="muted">media de {g.ratingCount} notas · {g.reviewCount} reseñas</span></> : <span className="muted">Sin notas todavía</span>}</p>
          </div>
          <MyPanel g={g} />
          <section>
            <h2 className="h1">Amigos</h2>
            {g.friendsAttended.length + g.friendsGoing.length === 0 ? <Empty>Ninguno de tus amigos está registrado en este concierto.</Empty> : (
              <div className="space-y-1 text-sm">
                {[['Fueron', g.friendsAttended], ['Van', g.friendsGoing]].map(([label, list]) => (list as typeof g.friendsGoing).length > 0 && (
                  <p key={label as string} className="flex flex-wrap items-center gap-2"><span className="muted">{label as string}:</span>
                    {(list as typeof g.friendsGoing).map((u) => <Link key={u.id} to={`/u/${u.id}`} className="inline-flex items-center gap-1 hover:underline"><Avatar user={u} size={22} />{u.displayName}</Link>)}
                  </p>))}
              </div>
            )}
          </section>
          <section>
            <h2 className="h1">Reseñas</h2>
            {g.reviews.length === 0 ? <Empty>Nadie ha reseñado este concierto aún.</Empty> : <div className="space-y-2">{g.reviews.map((r) => <ReviewCard key={r.attendance.id} r={r} showGig={false} />)}</div>}
          </section>
        </div>
      )}
    </Async>
  )
}
