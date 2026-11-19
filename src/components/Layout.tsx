import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/conciertos', label: 'Conciertos' },
  { to: '/wishlist', label: 'Wishlist' },
  { to: '/agenda', label: 'Agenda (Plus)' },
  { to: '/perfil', label: 'Perfil' },
]

export function Layout() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <header className="border-b border-black py-3">
        <div className="font-bold">Conciertos</div>
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
