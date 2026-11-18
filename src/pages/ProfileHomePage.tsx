import { Link } from 'react-router-dom'
import { ProfileOverview } from '@/components/profile'
import { Async } from '@/components/ui'
import { useMe, useProfile } from '@/data/hooks'

/** Resumen de mi perfil: favoritos, actividad reciente y reviews. */
export default function ProfileHomePage() {
  const me = useMe()
  const profile = useProfile(me.data?.id)
  return (
    <Async query={profile}>
      {(p) => (
        <div className="space-y-6">
          <ProfileOverview p={p} />
          <p className="text-center"><Link className="btn btn-primary px-8 py-3.5" to="/reviews">Ver todas las reviews</Link></p>
          <p className="text-center text-sm text-zinc-500">¿Tienes entradas en tu correo? <Link className="underline hover:text-zinc-950" to="/import">Importar conciertos desde un email (Plus)</Link>.</p>
        </div>
      )}
    </Async>
  )
}
