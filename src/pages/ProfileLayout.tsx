import { NavLink, Outlet } from 'react-router-dom'
import { ProfileHeader } from '@/components/profile'
import { Async } from '@/components/ui'
import { useMe, useProfile } from '@/data/hooks'

const sub = [
  { to: '/perfil', label: 'Resumen', end: true },
  { to: '/perfil/gigs', label: 'Gigs', end: false },
  { to: '/perfil/tags', label: 'Tags', end: false },
  { to: '/perfil/friends', label: 'Friends', end: false },
  { to: '/perfil/gigslists', label: 'Giglists', end: false },
  { to: '/agenda', label: 'Agenda', end: false },
  { to: '/suscripcion', label: 'Suscripción', end: false },
]

/** Marco de mi perfil: cabecera + submenú + sección activa. */
export default function ProfileLayout() {
  const me = useMe()
  const profile = useProfile(me.data?.id)
  return (
    <div className="space-y-4">
      <Async query={profile}>{(p) => <ProfileHeader p={p} />}</Async>
      <nav className="-mx-1 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-zinc-200" aria-label="Menú de perfil">
        {sub.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}
            className={({ isActive }) => `-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm ${isActive ? 'border-green-700 font-medium' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
