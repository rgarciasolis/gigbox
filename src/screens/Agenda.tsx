import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MonthCalendar } from '@/components/MonthCalendar'
import { Async, GigList, GigRow, GoingButton, Loading, Tabs } from '@/components/ui'
import { lineup } from '@/domain/format'
import type { AgendaFilters } from '@/domain/types'
import { useFlag } from '@/flags'
import { useAgenda, useFacets } from '@/queries'

const RADII = [25, 50, 100, 200, 500]

export function Agenda() {
  const flag = useFlag('agenda')
  if (flag.loading) return <Loading />
  if (!flag.enabled) {
    return (
      <div>
        <h1>Agenda</h1>
        <div className="box">
          <p>
            La Agenda te avisa de conciertos cercanos de tus artistas favoritos y de tu ciudad. Es una
            función de Plus.
          </p>
          <Link to="/perfil/ajustes/suscripcion">Ver suscripción</Link>
        </div>
      </div>
    )
  }
  return <AgendaPlus />
}

function AgendaPlus() {
  const [filters, setFilters] = useState<AgendaFilters>({ radiusKm: 100 })
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const q = useAgenda(filters, true)
  const facets = useFacets()
  const set = (p: Partial<AgendaFilters>) => setFilters((f) => ({ ...f, ...p }))

  return (
    <div>
      <h1>Agenda</h1>
      <div className="box">
        <label htmlFor="radius">Radio</label>
        <select id="radius" value={filters.radiusKm} onChange={(e) => set({ radiusKm: Number(e.target.value) })}>
          {RADII.map((r) => (
            <option key={r} value={r}>
              {r} km
            </option>
          ))}
        </select>
        <label htmlFor="from">Desde</label>
        <input id="from" type="date" value={filters.dateFrom ?? ''} onChange={(e) => set({ dateFrom: e.target.value || undefined })} />
        <label htmlFor="to">Hasta</label>
        <input id="to" type="date" value={filters.dateTo ?? ''} onChange={(e) => set({ dateTo: e.target.value || undefined })} />
        <label htmlFor="genre">Género</label>
        <select id="genre" value={filters.genre ?? ''} onChange={(e) => set({ genre: e.target.value || undefined })}>
          <option value="">Todos</option>
          {facets.data?.genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <Tabs
        value={view}
        onChange={setView}
        options={[
          { value: 'list', label: 'Lista' },
          { value: 'calendar', label: 'Calendario' },
        ]}
      />
      <div className="mt-3">
        <Async
          query={q}
          isEmpty={(d) => d.entries.length === 0}
          empty="No hay conciertos con estos filtros. Prueba a ampliar el radio."
        >
          {(d) =>
            view === 'list' ? (
              <>
                <p className="muted">Desde {d.origin.city}</p>
                <GigList>
                  {d.entries.map((e) => (
                    <GigRow
                      key={e.gig.id}
                      s={e}
                      note={`${e.distanceKm} km · ${e.reason.map((r) => (r === 'mi_artista' ? 'Un artista que sigues' : 'En tu ciudad')).join(', ')}`}
                      actions={<GoingButton gig={e} />}
                    />
                  ))}
                </GigList>
              </>
            ) : (
              <MonthCalendar
                items={d.entries.map((e) => ({
                  id: e.gig.id,
                  date: e.gig.startsAt,
                  label: lineup(e.artists),
                  to: `/conciertos/${e.gig.id}`,
                }))}
              />
            )
          }
        </Async>
      </div>
    </div>
  )
}
