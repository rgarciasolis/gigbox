import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { Async, MutationError } from '@/components/ui'
import { DATA_ADAPTER } from '@/data'
import { NOTIFICATION_RADIUS_OPTIONS, type User } from '@/domain/types'
import {
  useCurrentUser,
  useNotificationSettings,
  useSetRadius,
  useSubscription,
  useUpdateProfile,
} from '@/queries'

const MockDevPanel = lazy(() => import('@/data/mock/MockDevPanel'))

export function Ajustes() {
  const me = useCurrentUser()
  const sub = useSubscription()
  return (
    <div>
      <h1>Ajustes</h1>

      <h2>Editar perfil</h2>
      <Async query={me}>{(u) => <ProfileForm user={u} />}</Async>

      <h2>Avisos</h2>
      <RadiusSetting />

      <h2>Suscripción</h2>
      <p>
        Plan actual: <strong>{sub.data ? (sub.data.plus ? 'Plus' : 'Gratuito') : '...'}</strong>.{' '}
        <Link to="/perfil/ajustes/suscripcion">Gestionar suscripción</Link>
      </p>

      {DATA_ADAPTER === 'mock' && (
        <>
          <h2>Herramientas de desarrollo</h2>
          <Suspense fallback={<p className="muted">Cargando...</p>}>
            <MockDevPanel />
          </Suspense>
        </>
      )}
    </div>
  )
}

function RadiusSetting() {
  const q = useNotificationSettings()
  const set = useSetRadius()
  return (
    <Async query={q}>
      {(s) => (
        <div className="box">
          <label htmlFor="radius">Radio de los avisos de artistas</label>
          <select
            id="radius"
            value={s.radiusKm}
            disabled={set.isPending}
            onChange={(e) => set.mutate(Number(e.target.value))}
          >
            {NOTIFICATION_RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r} km
              </option>
            ))}
          </select>
          <p className="muted">
            Solo se te avisa de conciertos de artistas que sigues dentro de este radio desde tu ciudad.
          </p>
          <MutationError error={set.error} />
        </div>
      )}
    </Async>
  )
}

function ProfileForm({ user }: { user: User }) {
  const update = useUpdateProfile()
  const [displayName, setDisplayName] = useState(user.displayName)
  const [bio, setBio] = useState(user.bio)
  const [city, setCity] = useState(user.city)
  const [saved, setSaved] = useState(false)
  return (
    <form
      className="box"
      onSubmit={(e) => {
        e.preventDefault()
        setSaved(false)
        update.mutate({ displayName: displayName.trim(), bio, city: city.trim() }, { onSuccess: () => setSaved(true) })
      }}
    >
      <label htmlFor="name">Nombre</label>
      <input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      <label htmlFor="city">Ciudad</label>
      <input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
      <label htmlFor="bio">Bio</label>
      <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
      <button className="mt-2" disabled={!displayName.trim() || !city.trim() || update.isPending}>
        Guardar
      </button>
      {saved && <span role="status"> Guardado.</span>}
      <MutationError error={update.error} />
    </form>
  )
}
