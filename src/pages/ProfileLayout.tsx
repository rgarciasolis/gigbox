import { NavLink, Outlet } from 'react-router-dom'
import { ProfileHeader } from '@/components/profile'
import { Async } from '@/components/ui'
import { useMe, useProfile } from '@/data/hooks'

const sub = [
  { to: '/perfil', label: 'Resumen', end: true },
  { to: '/perfil/gigs', label: 'Gigs', end: false },
  { to: '/perfil/tags', label: 'Tags', end: false },
  { to: '/perfil/friends', label: 'Friends', end: false },
  { to: '/perfil/gigslists', label: 'Gigslists', end: false },
  { to: '/agenda', label: 'Agenda', end: false },
  { to: '/suscripcion', label: 'Suscripción', end: false },
]

/** Marco de mi perfil: cabecera + submenú + sección activa. */
export default function ProfileLayout() {
  const me = useMe()
  const profile = useProfile(me.data?.id)
  return (
    <div className="space-y-8">
      <Async query={profile}>{(p) => <ProfileHeader p={p} />}</Async>
      <nav className="flex flex-wrap justify-center gap-1" aria-label="Menú de perfil">
        {sub.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}
            className={({ isActive }) => `whitespace-nowrap rounded-sm px-3 py-2.5 text-xs uppercase ${isActive ? 'bg-green-600 text-zinc-50' : 'text-zinc-800 hover:bg-zinc-100'}`}>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
