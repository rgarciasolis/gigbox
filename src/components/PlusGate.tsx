import { Link } from 'react-router-dom'
import type { FeatureFlag } from '@/config/flags'
import { useFlag } from '@/data/hooks'
import { Loading, SectionHeader } from './ui'

/** Muestra los hijos solo si el flag esta activo; si no, una pantalla de bloqueo. */
export default function PlusGate({ flag, title, children }: { flag: FeatureFlag; title: string; children: React.ReactNode }) {
  const { enabled, isLoading } = useFlag(flag)
  if (isLoading) return <Loading />
  if (enabled) return <>{children}</>
  return (
    <div className="mx-auto max-w-xl">
      <SectionHeader as="h1" eyebrow="Plus" title={title} />
      <div className="card text-center">
        <p className="mb-4 text-lg text-zinc-700">{title} es una función Plus. Actívala en la pantalla de suscripción (simulada) para probarla.</p>
        <Link className="btn btn-primary px-8 py-3.5" to="/suscripcion">Ver suscripción</Link>
      </div>
    </div>
  )
}
