import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MonthCalendar } from '@/components/MonthCalendar'
import { Async, Empty, GigList, GigRow, GoingButton, Tabs } from '@/components/ui'
import { lineup } from '@/domain/format'
import { useVenue } from '@/queries'

export function Sala() {
  const { id = '' } = useParams()
  const q = useVenue(id)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  return (
    <Async query={q}>
      {({ venue, upcoming, past }) => (
        <div>
          <p>
            <Link to="/conciertos">Volver a Conciertos</Link>
          </p>
          <h1>{venue.name}</h1>
          <p>
            {venue.address}, {venue.city} ({venue.country})
          </p>

          <h2>Próximos conciertos</h2>
          <Tabs
            value={view}
            onChange={setView}
            options={[
              { value: 'list', label: 'Lista' },
              { value: 'calendar', label: 'Calendario' },
            ]}
          />
          <div className="mt-3">
            {upcoming.length === 0 ? (
              <Empty>No hay conciertos próximos en esta sala.</Empty>
            ) : view === 'list' ? (
              <GigList>
                {upcoming.map((s) => (
                  <GigRow key={s.gig.id} s={s} actions={<GoingButton gig={s} />} />
                ))}
              </GigList>
            ) : (
              <MonthCalendar
                items={upcoming.map((s) => ({
                  id: s.gig.id,
                  date: s.gig.startsAt,
                  label: lineup(s.artists),
                  to: `/conciertos/${s.gig.id}`,
                }))}
              />
            )}
          </div>

          <h2>Últimos conciertos</h2>
          {past.length === 0 ? (
            <Empty>Todavía no hay conciertos pasados en esta sala.</Empty>
          ) : (
            <GigList>
              {past.map((s) => (
                <GigRow key={s.gig.id} s={s} />
              ))}
            </GigList>
          )}
        </div>
      )}
    </Async>
  )
}
