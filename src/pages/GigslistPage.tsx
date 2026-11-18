import { useState } from 'react'
import { GigCard, GigGrid } from '@/components/gig'
import { Async, SectionHeader } from '@/components/ui'
import { useCreateGigslist, useGigslists, useRemoveFromGigslist, useUpcomingSaved } from '@/data/hooks'
import { fmtTileDate } from '@/lib'

export default function GigslistPage() {
  const saved = useUpcomingSaved()
  const lists = useGigslists()
  const create = useCreateGigslist()
  const remove = useRemoveFromGigslist()
  const [name, setName] = useState('')
  return (
    <div className="space-y-12">
      <section>
        <SectionHeader eyebrow="The wishlist" title="Próximos guardados" />
        <Async query={saved} empty="Todavía no has guardado conciertos futuros. Añádelos desde Gigs o Agenda.">
          {(list) => (
            <GigGrid>
              {list.map((s) => <GigCard key={s.gig.gig.id} view={s.gig} note={s.gigslistNames.join(', ')} />)}
            </GigGrid>
          )}
        </Async>
      </section>
      <section className="mx-auto max-w-3xl">
        <h2 className="h1 text-center">Mis gigslists</h2>
        <form className="mb-4 flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (name.trim()) { await create.mutateAsync(name); setName('') } }}>
          <input className="input" placeholder="Nueva gigslist" aria-label="Nombre de la gigslist" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn btn-primary" disabled={create.isPending}>Crear</button>
        </form>
        {create.isError && <p className="mb-2 text-sm text-red-700" role="alert">{(create.error as Error).message}</p>}
        <Async query={lists} empty="No tienes gigslists.">
          {(ls) => (
            <div className="space-y-6">
              {ls.map((l) => (
                <div key={l.gigslist.id}>
                  <h3 className="font-heading text-xl font-bold">{l.gigslist.name} <span className="text-sm font-normal text-zinc-500">({l.items.length})</span></h3>
                  {l.items.length === 0 ? <p className="muted">Vacía.</p> : (
                    <ul className="mt-1 divide-y divide-zinc-200">
                      {l.items.map((i) => (
                        <li key={i.gig.gig.id} className="flex items-center justify-between gap-3 py-2">
                          <span className="min-w-0 truncate"><span className="text-sm text-zinc-500">{fmtTileDate(i.gig.gig.date)}</span> · {i.gig.gig.title} <span className="text-sm text-zinc-500">· {i.gig.venue.city}</span></span>
                          <button className="shrink-0 text-sm text-zinc-500 underline hover:text-zinc-950" disabled={remove.isPending} onClick={() => remove.mutate({ gigslistId: l.gigslist.id, gigId: i.gig.gig.id })}>quitar</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </Async>
      </section>
    </div>
  )
}
