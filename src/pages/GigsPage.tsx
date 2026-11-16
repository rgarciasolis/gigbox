import { useState } from 'react'
import { AddToGigslist, GigCard } from '@/components/gig'
import { Async } from '@/components/ui'
import { useGigFilterOptions, useGigs } from '@/data/hooks'
import type { GigFilter } from '@/domain/views'

export default function GigsPage() {
  const [f, setF] = useState<GigFilter>({ scope: 'all', sort: 'date-desc' })
  const opts = useGigFilterOptions()
  const gigs = useGigs(f)
  const set = (p: Partial<GigFilter>) => setF((s) => ({ ...s, ...p }))
  return (
    <div>
      <h1 className="h1">Gigs</h1>
      <form className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-6" onSubmit={(e) => e.preventDefault()}>
        <input className="input col-span-2" placeholder="Buscar artista, sala, ciudad…" value={f.q ?? ''} onChange={(e) => set({ q: e.target.value })} aria-label="Buscar" />
        <select className="input" value={f.scope} onChange={(e) => set({ scope: e.target.value as GigFilter['scope'], sort: e.target.value === 'upcoming' ? 'date-asc' : 'date-desc' })} aria-label="Cuándo">
          <option value="all">Todos</option><option value="past">Pasados</option><option value="upcoming">Próximos</option>
        </select>
        <select className="input" value={f.city ?? ''} onChange={(e) => set({ city: e.target.value || undefined })} aria-label="Ciudad">
          <option value="">Todas las ciudades</option>{opts.data?.cities.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="input" value={f.genre ?? ''} onChange={(e) => set({ genre: e.target.value || undefined })} aria-label="Género">
          <option value="">Todos los géneros</option>{opts.data?.genres.map((c) => <option key={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={!!f.onlyMine} onChange={(e) => set({ onlyMine: e.target.checked })} /> Solo míos</label>
      </form>
      <Async query={gigs} empty="No hay conciertos con estos filtros.">
        {(list) => (
          <div className="space-y-2">
            <p className="muted">{list.length}{list.length === 200 ? '+' : ''} conciertos</p>
            {list.map((g) => <GigCard key={g.gig.id} view={g} extra={g.isUpcoming ? <AddToGigslist gigId={g.gig.id} compact /> : undefined} />)}
          </div>
        )}
      </Async>
    </div>
  )
}
