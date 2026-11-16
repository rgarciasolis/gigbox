import { useState } from 'react'
import { AddToGigslist, GigCard } from '@/components/gig'
import { Async } from '@/components/ui'
import { useGigFilterOptions, useGigs } from '@/data/hooks'
import type { GigFilter } from '@/domain/views'

const RATINGS: [string, number | undefined][] = [['Cualquier nota', undefined], ['4,5+', 4.5], ['4+', 4], ['3+', 3]]

export default function GigsPage() {
  const [f, setF] = useState<GigFilter>({ scope: 'all', sort: 'date-desc' })
  const opts = useGigFilterOptions()
  const gigs = useGigs(f)
  const set = (p: Partial<GigFilter>) => setF((s) => ({ ...s, ...p }))
  return (
    <div>
      <h1 className="h1">Gigs</h1>
      <form className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4" onSubmit={(e) => e.preventDefault()}>
        <input className="input col-span-2" placeholder="Buscar artista, sala, ciudad…" value={f.q ?? ''} onChange={(e) => set({ q: e.target.value })} aria-label="Buscar" />
        <select className="input" value={f.scope} onChange={(e) => set({ scope: e.target.value as GigFilter['scope'], sort: e.target.value === 'upcoming' ? 'date-asc' : 'date-desc' })} aria-label="Cuándo">
          <option value="all">Todos</option><option value="past">Pasados</option><option value="upcoming">Próximos</option>
        </select>
        <select className="input" value={f.sort} onChange={(e) => set({ sort: e.target.value as GigFilter['sort'] })} aria-label="Orden">
          <option value="date-desc">Más recientes</option><option value="date-asc">Más antiguos</option>
        </select>
        <select className="input" value={f.artistId ?? ''} onChange={(e) => set({ artistId: e.target.value || undefined })} aria-label="Artista">
          <option value="">Todos los artistas</option>{opts.data?.artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select className="input" value={f.venueId ?? ''} onChange={(e) => set({ venueId: e.target.value || undefined })} aria-label="Lugar">
          <option value="">Todos los lugares</option>{opts.data?.venues.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.city})</option>)}
        </select>
        <select className="input" value={f.genre ?? ''} onChange={(e) => set({ genre: e.target.value || undefined })} aria-label="Género">
          <option value="">Todos los géneros</option>{opts.data?.genres.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="input" value={String(f.minRating ?? '')} onChange={(e) => set({ minRating: e.target.value === '' ? undefined : Number(e.target.value) })} aria-label="Puntuación mínima">
          {RATINGS.map(([l, v]) => <option key={l} value={String(v ?? '')}>{l}</option>)}
        </select>
        <label className="flex min-w-0 flex-col items-start gap-1 text-sm"><span className="muted">Desde</span>
          <input type="date" className="input min-w-0" value={f.from ?? ''} onChange={(e) => set({ from: e.target.value || undefined })} aria-label="Desde fecha" />
        </label>
        <label className="flex min-w-0 flex-col items-start gap-1 text-sm"><span className="muted">Hasta</span>
          <input type="date" className="input min-w-0" value={f.to ?? ''} onChange={(e) => set({ to: e.target.value || undefined })} aria-label="Hasta fecha" />
        </label>
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
