import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MonthCalendar } from '@/components/MonthCalendar'
import { Async, Empty, GigList, GigRow, MutationError, Tabs } from '@/components/ui'
import { lineup } from '@/domain/format'
import type { TicketStatus } from '@/domain/types'
import {
  useMarkAttended,
  useRemoveFromWishlist,
  useSetTicketStatus,
  useWishlist,
} from '@/queries'

export function Wishlist() {
  const q = useWishlist()
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const setStatus = useSetTicketStatus()
  const remove = useRemoveFromWishlist()
  const attend = useMarkAttended()

  return (
    <div>
      <h1>Wishlist</h1>
      <p className="muted">
        Tus próximos conciertos. <Link to="/conciertos?scope=future">Buscar conciertos</Link>
      </p>
      <Async
        query={q}
        isEmpty={(d) => d.length === 0}
        empty={
          <>
            Tu Wishlist está vacía. Pulsa <strong>Voy a ir</strong> en un concierto futuro para guardarlo.
          </>
        }
      >
        {(entries) => {
          const pending = entries.filter((e) => e.gig.isPast)
          const upcoming = entries.filter((e) => !e.gig.isPast)
          return (
            <>
              {pending.length > 0 && (
                <>
                  <h2>Pendientes de confirmar</h2>
                  <p className="muted">Estos conciertos ya han pasado. ¿Fuiste?</p>
                  <GigList>
                    {pending.map((e) => (
                      <GigRow
                        key={e.gig.gig.id}
                        s={e.gig}
                        actions={
                          <>
                            <button
                              className="primary"
                              disabled={attend.isPending}
                              onClick={() => attend.mutate(e.gig.gig.id)}
                            >
                              Fui
                            </button>
                            <button disabled={remove.isPending} onClick={() => remove.mutate(e.gig.gig.id)}>
                              Quitar
                            </button>
                          </>
                        }
                      />
                    ))}
                  </GigList>
                </>
              )}

              <h2>Próximos</h2>
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
                  <Empty>No tienes conciertos futuros guardados.</Empty>
                ) : view === 'list' ? (
                  <GigList>
                    {upcoming.map((e) => (
                      <GigRow
                        key={e.gig.gig.id}
                        s={e.gig}
                        actions={
                          <>
                            <select
                              aria-label="Estado de entrada"
                              value={e.item.ticketStatus}
                              disabled={setStatus.isPending}
                              onChange={(ev) =>
                                setStatus.mutate({
                                  gigId: e.gig.gig.id,
                                  status: ev.target.value as TicketStatus,
                                })
                              }
                            >
                              <option value="no_ticket">No tengo entrada</option>
                              <option value="has_ticket">Tengo entrada</option>
                            </select>
                            <button disabled={remove.isPending} onClick={() => remove.mutate(e.gig.gig.id)}>
                              Quitar
                            </button>
                          </>
                        }
                      />
                    ))}
                  </GigList>
                ) : (
                  <MonthCalendar
                    items={upcoming.map((e) => ({
                      id: e.gig.gig.id,
                      date: e.gig.gig.startsAt,
                      label: lineup(e.gig.artists),
                      to: `/conciertos/${e.gig.gig.id}`,
                    }))}
                  />
                )}
              </div>
              <MutationError error={setStatus.error ?? remove.error ?? attend.error} />
            </>
          )
        }}
      </Async>
    </div>
  )
}
