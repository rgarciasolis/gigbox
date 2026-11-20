import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { localDay } from '@/domain/format'

export interface CalendarItem {
  id: string
  date: string // ISO
  label: string
  to: string
}

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

/** Calendario mensual basico (lunes primero) con enlaces a cada concierto. */
export function MonthCalendar({ items }: { items: CalendarItem[] }) {
  const first = useMemo(() => {
    const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date))
    const d = sorted.length ? new Date(sorted[0].date) : new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  }, [items])
  const [cursor, setCursor] = useState(first)

  const byDay = useMemo(() => {
    const m = new Map<string, CalendarItem[]>()
    for (const it of items) {
      const k = localDay(it.date)
      m.set(k, [...(m.get(k) ?? []), it])
    }
    return m
  }, [items])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const offset = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7) cells.push(null)
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7))
  const title = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(cursor)

  return (
    <div>
      <div className="row mb-2">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))}>Anterior</button>
        <strong style={{ minWidth: '10rem', textAlign: 'center' }}>{title}</strong>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))}>Siguiente</button>
      </div>
      <div className="overflow-x-auto">
        <table style={{ width: '100%', tableLayout: 'fixed', minWidth: '36rem' }}>
          <thead>
            <tr>
              {DAYS.map((d) => (
                <th key={d}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((w, i) => (
              <tr key={i}>
                {w.map((day, j) => {
                  const key = day
                    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    : ''
                  const list = day ? (byDay.get(key) ?? []) : []
                  return (
                    <td key={j} style={{ height: '5rem' }}>
                      {day && <div className="muted">{day}</div>}
                      {list.map((it) => (
                        <div key={it.id} style={{ overflowWrap: 'anywhere' }}>
                          <Link to={it.to}>{it.label}</Link>
                        </div>
                      ))}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
