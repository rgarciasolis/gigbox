import { useState } from 'react'
import { GigCard, GigGrid } from '@/components/gig'
import { Async, SectionHeader, Tabs } from '@/components/ui'
import { useMyAttendances } from '@/data/hooks'
import type { AttendanceStatus } from '@/domain/types'

/** Mis conciertos registrados (todas mis asistencias). */
export default function MyGigsPage() {
  const [status, setStatus] = useState<AttendanceStatus | 'all'>('all')
  const q = useMyAttendances(undefined, status === 'all' ? undefined : status)
  return (
    <div>
      <SectionHeader eyebrow="Tu diario de conciertos" title="Mis conciertos" />
      <Tabs value={status} onChange={setStatus} options={[
        { value: 'all' as const, label: 'Todos' },
        { value: 'attended' as const, label: 'Asistí' },
        { value: 'going' as const, label: 'Voy' },
      ]} />
      <Async query={q} empty="Aún no has registrado conciertos. Búscalos en Gigs o impórtalos desde un email.">
        {(list) => (
          <div className="space-y-4">
            <p className="muted text-center">{list.length} conciertos</p>
            <GigGrid>{list.map((a) => <GigCard key={a.attendance.id} view={a.gig} extra={a.tags.length ? <span>{a.tags.map((t) => t.name).join(', ')}</span> : undefined} />)}</GigGrid>
          </div>
        )}
      </Async>
    </div>
  )
}
