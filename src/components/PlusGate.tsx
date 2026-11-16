import { Link } from 'react-router-dom'
import type { FeatureFlag } from '@/config/flags'
import { useFlag } from '@/data/hooks'
import { Loading } from './ui'

/** Muestra los hijos solo si el flag esta activo; si no, una pantalla de bloqueo. */
export default function PlusGate({ flag, title, children }: { flag: FeatureFlag; title: string; children: React.ReactNode }) {
  const { enabled, isLoading } = useFlag(flag)
  if (isLoading) return <Loading />
  if (enabled) return <>{children}</>
  return (
    <div className="card text-center">
      <h1 className="h1">{title} es una función Plus</h1>
      <p className="muted mb-3">Activa Plus en la pantalla de suscripción (simulada) para probarla.</p>
      <Link className="btn btn-primary" to="/suscripcion">Ver suscripción</Link>
    </div>
  )
}
