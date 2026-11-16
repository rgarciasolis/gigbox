import { useState } from 'react'
import { GigCard } from '@/components/gig'
import { Async } from '@/components/ui'
import { useCreateGigslist, useGigslists, useRemoveFromGigslist, useUpcomingSaved } from '@/data/hooks'
import { fmtDate } from '@/lib'

export default function GigslistPage() {
  const saved = useUpcomingSaved()
  const lists = useGigslists()
  const create = useCreateGigslist()
  const remove = useRemoveFromGigslist()
  const [name, setName] = useState('')
  return (
    <div className="space-y-6">
      <section>
        <h1 className="h1">Próximos guardados</h1>
        <Async query={saved} empty="Todavía no has guardado conciertos futuros. Añádelos desde Gigs o Agenda.">
          {(list) => (
            <div className="space-y-2">
              {list.map((s) => <GigCard key={s.gig.gig.id} view={s.gig} extra={<span className="muted">{s.gigslistNames.join(', ')}</span>} />)}
            </div>
          )}
        </Async>
      </section>
      <section>
        <h2 className="h1">Mis gigslists</h2>
        <form className="mb-3 flex gap-1" onSubmit={async (e) => { e.preventDefault(); if (name.trim()) { await create.mutateAsync(name); setName('') } }}>
          <input className="input" placeholder="Nueva gigslist" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn" disabled={create.isPending}>Crear</button>
        </form>
        {create.isError && <p className="mb-2 text-sm text-red-700">{(create.error as Error).message}</p>}
        <Async query={lists} empty="No tienes gigslists.">
          {(ls) => (
            <div className="space-y-4">
              {ls.map((l) => (
                <div key={l.gigslist.id}>
                  <h3 className="font-medium">{l.gigslist.name} <span className="muted">({l.items.length})</span></h3>
                  {l.items.length === 0 ? <p className="muted">Vacía.</p> : (
                    <ul className="mt-1 divide-y divide-neutral-100 text-sm">
                      {l.items.map((i) => (
                        <li key={i.gig.gig.id} className="flex items-center justify-between py-1">
                          <span>{fmtDate(i.gig.gig.date)} · {i.gig.gig.title} <span className="muted">· {i.gig.venue.city}</span></span>
                          <button className="muted underline" disabled={remove.isPending} onClick={() => remove.mutate({ gigslistId: l.gigslist.id, gigId: i.gig.gig.id })}>quitar</button>
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
