import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GigCard } from '@/components/gig'
import { Async } from '@/components/ui'
import { useCreateTag, useMyAttendances, useRemoveTag, useTags } from '@/data/hooks'

export default function TagsPage() {
  const [params, setParams] = useSearchParams()
  const tagId = params.get('tag') ?? undefined
  const tags = useTags()
  const gigs = useMyAttendances(tagId)
  const create = useCreateTag()
  const remove = useRemoveTag()
  const [name, setName] = useState('')
  return (
    <div className="space-y-5">
      <h1 className="h1">Tags</h1>
      <form className="flex gap-1" onSubmit={async (e) => { e.preventDefault(); if (name.trim()) { await create.mutateAsync(name); setName('') } }}>
        <input className="input" placeholder="Nuevo tag" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn" disabled={create.isPending}>Crear</button>
      </form>
      {create.isError && <p className="text-sm text-red-700">{(create.error as Error).message}</p>}
      <Async query={tags} empty="No tienes tags. Crea uno arriba.">
        {(list) => (
          <div className="flex flex-wrap gap-2">
            <button className={`rounded-full border px-3 py-1 text-sm ${!tagId ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300'}`} onClick={() => setParams({})}>Todos</button>
            {list.map(({ tag, count }) => (
              <span key={tag.id} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${tagId === tag.id ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300'}`}>
                <button onClick={() => setParams({ tag: tag.id })}>{tag.name} ({count})</button>
                <button aria-label={`Borrar ${tag.name}`} className="opacity-60 hover:opacity-100" onClick={() => { if (tagId === tag.id) setParams({}); remove.mutate(tag.id) }}>×</button>
              </span>
            ))}
          </div>
        )}
      </Async>
      <section>
        <h2 className="h1">Mis gigs{tagId ? ' con este tag' : ''}</h2>
        <Async query={gigs} empty={tagId ? 'Ningún gig tiene este tag.' : 'Aún no has registrado conciertos.'}>
          {(list) => <div className="space-y-2">{list.map((a) => <GigCard key={a.attendance.id} view={a.gig} extra={<span className="muted">{a.tags.map((t) => t.name).join(', ')}</span>} />)}</div>}
        </Async>
      </section>
    </div>
  )
}
