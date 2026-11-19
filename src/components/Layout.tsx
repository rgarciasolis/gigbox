import { NavLink, Outlet } from 'react-router-dom'
import { useUnreadCount } from '@/queries'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/conciertos', label: 'Conciertos' },
  { to: '/wishlist', label: 'Wishlist' },
  { to: '/perfil', label: 'Perfil' },
]

function Bell() {
  const unread = useUnreadCount().data ?? 0
  return (
    <NavLink
      to="/avisos"
      aria-label={unread > 0 ? `Avisos, ${unread} sin leer` : 'Avisos'}
      className={({ isActive }) => (isActive ? 'font-bold' : '')}
    >
      Avisos{unread > 0 && ` (${unread})`}
    </NavLink>
  )
}

export function Layout() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <header className="border-b border-black py-3">
        <div className="flex items-center justify-between">
          <div className="font-bold">Conciertos</div>
          <Bell />
        </div>
        <nav aria-label="Principal" className="row mt-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => (isActive ? 'font-bold' : '')}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="pt-4">
        <Outlet />
      </main>
    </div>
  )
}
