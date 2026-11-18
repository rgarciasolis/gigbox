import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GigCard, GigGrid } from '@/components/gig'
import { Async, SectionHeader } from '@/components/ui'
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
      <SectionHeader eyebrow="Tus etiquetas" title="Tags" />
      <form className="mx-auto flex max-w-md gap-2" onSubmit={async (e) => { e.preventDefault(); if (name.trim()) { await create.mutateAsync(name); setName('') } }}>
        <input className="input" placeholder="Nuevo tag" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-primary" disabled={create.isPending}>Crear</button>
      </form>
      {create.isError && <p className="text-center text-sm text-red-700">{(create.error as Error).message}</p>}
      <Async query={tags} empty="No tienes tags. Crea uno arriba.">
        {(list) => (
          <div className="flex flex-wrap justify-center gap-2">
            <button className={`chip ${!tagId ? 'chip-on' : ''}`} onClick={() => setParams({})}>Todos</button>
            {list.map(({ tag, count }) => (
              <span key={tag.id} className={`chip ${tagId === tag.id ? 'chip-on' : ''}`}>
                <button onClick={() => setParams({ tag: tag.id })}>{tag.name} ({count})</button>
                <button aria-label={`Borrar ${tag.name}`} className="opacity-60 hover:opacity-100" onClick={() => { if (tagId === tag.id) setParams({}); remove.mutate(tag.id) }}>×</button>
              </span>
            ))}
          </div>
        )}
      </Async>
      <section>
        <h2 className="h1 text-center">Mis gigs{tagId ? ' con este tag' : ''}</h2>
        <Async query={gigs} empty={tagId ? 'Ningún gig tiene este tag.' : 'Aún no has registrado conciertos.'}>
          {(list) => <GigGrid>{list.map((a) => <GigCard key={a.attendance.id} view={a.gig} extra={a.tags.length ? <span>{a.tags.map((t) => t.name).join(', ')}</span> : undefined} />)}</GigGrid>}
        </Async>
      </section>
    </div>
  )
}
