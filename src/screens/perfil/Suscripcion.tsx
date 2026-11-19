import { Link } from 'react-router-dom'
import { Async, MutationError } from '@/components/ui'
import { useSetPlus, useSubscription } from '@/queries'

export function Suscripcion() {
  const q = useSubscription()
  const set = useSetPlus()
  return (
    <div>
      <p>
        <Link to="/perfil/ajustes">Volver a Ajustes</Link>
      </p>
      <h1>Suscripción</h1>
      <Async query={q}>
        {(s) => (
          <div className="box">
            <p>
              Plan actual: <strong>{s.plus ? 'Plus' : 'Gratuito'}</strong>
            </p>
            <p className="muted">Plus incluye la Agenda: conciertos cercanos de tus artistas y tu ciudad.</p>
            <button className="primary" disabled={set.isPending} onClick={() => set.mutate(!s.plus)}>
              {s.plus ? 'Volver al plan gratuito' : 'Activar Plus (simulado)'}
            </button>
            <p className="muted text-sm">En el MVP no hay pagos: el botón solo simula el cambio de plan.</p>
            <MutationError error={set.error} />
          </div>
        )}
      </Async>
    </div>
  )
}
