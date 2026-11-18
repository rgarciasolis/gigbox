import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AddToGigslist, GigCard, GigGrid } from '@/components/gig'
import { Async, SectionHeader, Tabs } from '@/components/ui'
import { useAgenda, useFlag, useGigFilterOptions, useMe } from '@/data/hooks'
import type { AgendaItem, AgendaQuery } from '@/domain/views'

const RADII: [string, number | null][] = [['Solo mi ciudad', null], ['50 km', 50], ['150 km', 150], ['300 km', 300], ['600 km', 600], ['Sin límite', 99999]]
const REASON = { artist: 'Tu artista', city: 'Tu ciudad', both: 'Tu artista y tu ciudad' }

function Calendar({ items }: { items: AgendaItem[] }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const offset = (first.getDay() + 6) % 7
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, i) => (i < offset || i >= offset + count ? null : i - offset + 1))
  }, [month])
  const byDay = (d: number) => items.filter((i) => { const x = new Date(i.gig.gig.date); return x.getFullYear() === month.getFullYear() && x.getMonth() === month.getMonth() && x.getDate() === d })
  const label = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(month)
  return (
    <div>
      <div className="mx-auto mb-3 flex max-w-4xl items-center justify-between">
        <button className="btn" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>←</button>
        <span className="font-heading text-2xl font-bold first-letter:uppercase">{label}</span>
        <button className="btn" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>→</button>
      </div>
      <div className="mx-auto grid max-w-4xl grid-cols-7 gap-px overflow-hidden rounded bg-zinc-200 text-xs">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => <div key={d} className="bg-green-50 p-1 text-center font-bold text-zinc-950">{d}</div>)}
        {days.map((d, i) => (
          <div key={i} className="min-h-16 bg-zinc-50 p-1 sm:min-h-24">
            {d && <><span className="text-zinc-500">{d}</span>
              {byDay(d).map((it) => (
                <Link key={it.gig.gig.id} to={`/gigs/${it.gig.gig.id}`} className="mt-0.5 block truncate rounded-sm bg-green-600 px-1 text-zinc-50 hover:bg-green-700" title={`${it.gig.gig.title} · ${it.gig.venue.city}`}>{it.gig.artists[0].name}</Link>
              ))}</>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AgendaPage() {
  const { enabled } = useFlag('agenda')
  const me = useMe()
  const options = useGigFilterOptions()
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [q, setQ] = useState<AgendaQuery>({ radiusKm: 300, onlyMyArtists: false })
  const agenda = useAgenda(q, enabled)
  return (
    <div>
      <SectionHeader as="h1" eyebrow={`Plus · desde ${me.data?.city ?? '…'}`} title="Agenda" />
      <form className="mx-auto mb-8 grid max-w-5xl grid-cols-2 items-center gap-2 sm:grid-cols-5" onSubmit={(e) => e.preventDefault()}>
        <select className="input" aria-label="Radio" value={String(q.radiusKm)} onChange={(e) => setQ({ ...q, radiusKm: e.target.value === 'null' ? null : Number(e.target.value) })}>
          {RADII.map(([l, v]) => <option key={l} value={String(v)}>{l}</option>)}
        </select>
        <select className="input" aria-label="Género" value={q.genre ?? ''} onChange={(e) => setQ({ ...q, genre: e.target.value || undefined })}>
          <option value="">Todos los géneros</option>{options.data?.genres.map((g) => <option key={g}>{g}</option>)}
        </select>
        <input type="date" className="input" aria-label="Desde" value={q.from ?? ''} onChange={(e) => setQ({ ...q, from: e.target.value || undefined })} />
        <input type="date" className="input" aria-label="Hasta" value={q.to ?? ''} onChange={(e) => setQ({ ...q, to: e.target.value || undefined })} />
        <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={!!q.onlyMyArtists} onChange={(e) => setQ({ ...q, onlyMyArtists: e.target.checked })} /> Solo mis artistas</label>
      </form>
      <Tabs value={view} onChange={setView} options={[{ value: 'list', label: 'Lista' }, { value: 'calendar', label: 'Calendario' }]} />
      <Async query={agenda} empty="No hay conciertos próximos con estos filtros.">
        {(items) => view === 'calendar' ? <Calendar items={items} /> : (
          <div className="space-y-4">
            <p className="muted text-center">{items.length} conciertos</p>
            <GigGrid>
              {items.map((it) => (
                <GigCard key={it.gig.gig.id} view={it.gig}
                  note={`${REASON[it.reason]}${it.distanceKm !== null ? ` · ${it.distanceKm} km` : ''}`}
                  extra={<AddToGigslist gigId={it.gig.gig.id} compact />} />
              ))}
            </GigGrid>
          </div>
        )}
      </Async>
    </div>
  )
}
