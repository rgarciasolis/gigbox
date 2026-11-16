import { useState } from 'react'
import { GigCard } from '@/components/gig'
import { Async, Tabs } from '@/components/ui'
import { useMyAttendances } from '@/data/hooks'
import type { AttendanceStatus } from '@/domain/types'

/** Mis conciertos registrados (todas mis asistencias). */
export default function MyGigsPage() {
  const [status, setStatus] = useState<AttendanceStatus | 'all'>('all')
  const q = useMyAttendances(undefined, status === 'all' ? undefined : status)
  return (
    <div>
      <h1 className="h1">Mis conciertos registrados</h1>
      <Tabs value={status} onChange={setStatus} options={[
        { value: 'all' as const, label: 'Todos' },
        { value: 'attended' as const, label: 'Asistí' },
        { value: 'going' as const, label: 'Voy' },
      ]} />
      <Async query={q} empty="Aún no has registrado conciertos. Búscalos en Gigs o impórtalos desde un email.">
        {(list) => (
          <div className="space-y-2">
            <p className="muted">{list.length} conciertos</p>
            {list.map((a) => <GigCard key={a.attendance.id} view={a.gig} extra={<span className="muted">{a.tags.map((t) => t.name).join(', ')}</span>} />)}
          </div>
        )}
      </Async>
    </div>
  )
}
