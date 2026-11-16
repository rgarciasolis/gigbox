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
        <div className="space-y-5">
          <ProfileOverview p={p} />
          <Link className="text-sm underline" to="/reviews">Ver todas las reviews</Link>
          <p className="muted text-sm">¿Tienes entradas en tu correo? <Link className="underline" to="/import">Importar conciertos desde un email (Plus)</Link>.</p>
        </div>
      )}
    </Async>
  )
}
