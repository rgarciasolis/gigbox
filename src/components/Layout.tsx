import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useUnreadCount } from '@/queries'

// Destinos segun el Figma: la marca lleva a Home; la campana abre Avisos.
const links = [
  { to: '/conciertos', label: 'Conciertos' },
  { to: '/wishlist', label: 'Wishlist' },
  { to: '/perfil', label: 'Perfil' },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `!text-[var(--zinc-800)] uppercase ${isActive ? 'font-bold' : ''}`

function useHasUnread() {
  return (useUnreadCount().data ?? 0) > 0
}

/** Campana de Avisos: solo indica si hay avisos nuevos (punto), no cuantos. */
function Bell() {
  const hasUnread = useHasUnread()
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

/** Lupa del artboard: lleva a la busqueda de conciertos. */
function Search() {
  return (
    <NavLink to="/conciertos" aria-label="Buscar conciertos" className="!text-[var(--zinc-800)]">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
        <circle cx="7" cy="7" r="4.5" />
        <path d="m10.5 10.5 3 3" />
      </svg>
    </NavLink>
  )
}

/** Menu movil (artboard movil): tres barras verdes; abre la lista de destinos y Avisos. */
function MobileMenu() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const hasUnread = useHasUnread()
  useEffect(() => setOpen(false), [pathname])
  return (
    <div className="ml-auto md:hidden">
      <button
        type="button"
        aria-label={hasUnread ? 'Menú, hay avisos nuevos' : 'Menú'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-6 w-6 flex-col justify-center gap-1 !border-0 !bg-transparent !p-0"
      >
        {[0, 1, 2].map((i) => (
          <span key={i} className="block h-0.5 w-6 bg-[var(--green-600)]" />
        ))}
        {hasUnread && (
          <span
            data-testid="menu-dot"
            className="absolute -right-1 -top-1 size-2 rounded-full bg-[var(--green-300)] ring-2 ring-[var(--zinc-50)]"
          />
        )}
      </button>
      {open && (
        <nav
          aria-label="Principal"
          className="absolute left-0 right-0 top-14 z-10 border-b border-[var(--zinc-100)] bg-[var(--zinc-50)] px-4 py-2"
        >
          {[...links, { to: '/avisos', label: 'Avisos' }].map((l) => (
            <NavLink key={l.to} to={l.to} className={(s) => `${linkClass(s)} flex items-center gap-2 py-3`}>
              {l.label}
              {l.to === '/avisos' && hasUnread && (
                <span className="size-1.5 rounded-full bg-[var(--green-300)]" aria-label="hay novedades" />
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}

// Columna ancha (1120 px) en todas las pantallas, como el artboard del Home.

export function Layout() {
  const width = 'max-w-[1120px]'
  return (
    <div>
      <header className="relative h-14 md:border-b md:border-[var(--zinc-100)] md:bg-[var(--zinc-50)]">
        <div className={`mx-auto flex h-full ${width} items-center justify-between gap-3 px-4`}>
          <NavLink to="/" end className="absolute left-1/2 -translate-x-1/2 !text-[var(--zinc-800)] !no-underline whitespace-nowrap text-base font-bold md:static md:translate-x-0">
            Mis conciertos
          </NavLink>
          <nav aria-label="Principal" className="hidden items-center gap-4 md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
            <Bell />
            <Search />
          </nav>
          <MobileMenu />
        </div>
      </header>
      <main className={`mx-auto ${width} px-4 pb-16 pt-10`}>
        <Outlet />
      </main>
    </div>
  )
}
