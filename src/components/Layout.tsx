import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useUnreadCount } from '@/queries'

// Destinos segun el Figma: la marca lleva a Home; la campana abre Avisos.
const links = [
  { to: '/conciertos', label: 'Conciertos' },
  { to: '/wishlist', label: 'Wishlist' },
  { to: '/perfil', label: 'Perfil' },
]

/** Campana de Avisos: solo indica si hay avisos nuevos (punto), no cuantos. */
function Bell() {
  const hasUnread = (useUnreadCount().data ?? 0) > 0
  return (
    <NavLink
      to="/avisos"
      aria-label={hasUnread ? 'Avisos, hay novedades' : 'Avisos'}
      className="relative !text-[var(--zinc-800)]"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
        <path d="M8 3a3 3 0 0 0-3 3c0 3-1.5 4-1.5 4h9S11 9 11 6a3 3 0 0 0-3-3Z" />
        <path d="M6.8 12.5a1.3 1.3 0 0 0 2.4 0" />
      </svg>
      {hasUnread && (
        <span
          data-testid="bell-dot"
          className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-[var(--green-300)]"
        />
      )}
    </NavLink>
  )
}

// Pantallas ya rediseñadas segun Figma: columna ancha (1120 px). El resto sigue a 600 px.
const WIDE = (path: string) => path === '/' || path.startsWith('/actividad/')

/** Lupa del artboard: lleva a la busqueda de conciertos. */
function Search() {
  return (
    <NavLink to="/conciertos" aria-label="Buscar conciertos" className="hidden !text-[var(--zinc-800)] sm:block">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
        <circle cx="7" cy="7" r="4.5" />
        <path d="m10.5 10.5 3 3" />
      </svg>
    </NavLink>
  )
}

export function Layout() {
  const wide = WIDE(useLocation().pathname)
  const width = wide ? 'max-w-[1120px]' : 'max-w-[600px]'
  return (
    <div>
      <header className="h-14 border-b border-[var(--zinc-100)] bg-[var(--zinc-50)]">
        <div className={`mx-auto flex h-full ${width} items-center justify-between gap-3 px-4`}>
          <NavLink to="/" end className="!text-[var(--zinc-800)] !no-underline whitespace-nowrap text-base font-bold">
            Mis conciertos
          </NavLink>
          <nav aria-label="Principal" className="flex items-center gap-2.5 sm:gap-4">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `!text-[var(--zinc-800)] uppercase ${isActive ? 'font-bold' : ''}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Bell />
            <Search />
          </nav>
        </div>
      </header>
      <main className={`mx-auto ${width} px-4 pb-16 pt-10`}>
        <Outlet />
      </main>
    </div>
  )
}
