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
    <section className="card space-y-4">
      <h2 className="font-heading text-2xl font-bold">Mi registro</h2>
      <div className="flex flex-wrap gap-2">
        {!mine || mine.status !== 'attended' ? (
          <button className="btn btn-primary" disabled={up.isPending} onClick={() => up.mutate({ gigId, status: 'attended' })}>
            {g.isUpcoming ? 'Ya fui' : 'Asistí'}
          </button>
        ) : <span className="rounded-sm bg-green-600 px-2 py-2 text-xs font-bold uppercase text-zinc-50">Asistí ✓</span>}
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
                  <button key={tag.id} className={`chip py-0.5 text-xs ${on ? 'chip-on' : ''}`}
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
              <button className="btn btn-primary">Añadir</button>
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
        <div className="mx-auto max-w-3xl space-y-10">
          <header className="overflow-hidden rounded bg-green-50 text-center">
            <p className="py-1 text-sm text-zinc-500"><Link to="/gigs" className="underline hover:text-zinc-950">Gigs</Link> / ficha</p>
            <p className="flex h-[22px] items-center justify-center text-sm text-zinc-950">{fmtDateLong(g.gig.date)}</p>
            <div className="px-4 py-6">
              <h1 className="font-heading text-5xl font-bold leading-[1.05] text-[#151515]">{g.artists[0]?.name ?? g.gig.title}</h1>
              {g.artists.length > 1 && <p className="mt-3 font-heading text-2xl font-bold text-[#151515]">{g.artists.slice(1).map((a) => a.name).join(', ')}</p>}
              <p className="mt-3 text-sm text-zinc-700">{g.artists.map((a) => a.genre).filter((v, i, arr) => arr.indexOf(v) === i).join(' · ')}</p>
              <p className="mt-4 text-lg text-zinc-800">
                {g.avgRating !== null ? <><Rating value={Math.round(g.avgRating * 2) / 2} /> <span className="text-sm text-zinc-500">media de {g.ratingCount} {g.ratingCount === 1 ? 'nota' : 'notas'} · {g.reviewCount} {g.reviewCount === 1 ? 'reseña' : 'reseñas'}</span></> : <span className="text-sm text-zinc-500">Sin notas todavía</span>}
              </p>
              <p className="mt-2 text-sm text-zinc-700">
                <span title="Asistencias registradas en Gigbox, no el aforo del recinto">Asistieron:</span> {g.attendeeCount} {g.attendeeCount === 1 ? 'persona' : 'personas'}
                {g.friendsAttended.length > 0 && <span className="text-zinc-500"> · {g.friendsAttended.length} {g.friendsAttended.length === 1 ? 'amigo tuyo fue' : 'amigos tuyos fueron'}</span>}
              </p>
            </div>
            <p className="bg-green-950 px-2 py-[5px] text-xs uppercase text-green-50">{g.venue.name}, {g.venue.city} ({g.venue.country})</p>
          </header>
          <MyPanel g={g} />
          <section>
            <h2 className="h1 text-center">Amigos</h2>
            {g.friendsAttended.length + g.friendsGoing.length === 0 ? <Empty>Ninguno de tus amigos está registrado en este concierto.</Empty> : (
              <div className="space-y-2 text-center text-lg">
                {[['Fueron', g.friendsAttended], ['Van', g.friendsGoing]].map(([label, list]) => (list as typeof g.friendsGoing).length > 0 && (
                  <p key={label as string} className="flex flex-wrap items-center justify-center gap-3"><span className="text-sm text-zinc-500">{label as string}:</span>
                    {(list as typeof g.friendsGoing).map((u) => <Link key={u.id} to={`/u/${u.id}`} className="inline-flex items-center gap-1 hover:underline"><Avatar user={u} size={24} />{u.displayName}</Link>)}
                  </p>))}
              </div>
            )}
          </section>
          <section>
            <h2 className="h1 text-center">Reseñas</h2>
            {g.reviews.length === 0 ? <Empty>Nadie ha reseñado este concierto aún.</Empty> : <div className="space-y-8">{g.reviews.map((r) => <ReviewCard key={r.attendance.id} r={r} showGig={false} />)}</div>}
          </section>
        </div>
      )}
    </Async>
  )
}
