import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const SECTIONS = [
  { to: '/perfil', label: 'Resumen', end: true },
  { to: '/perfil/historico', label: 'Histórico' },
  { to: '/perfil/resenas', label: 'Reseñas' },
  { to: '/perfil/listas', label: 'Listas' },
  { to: '/perfil/tags', label: 'Tags' },
  { to: '/perfil/estadisticas', label: 'Estadísticas' },
  { to: '/perfil/artistas', label: 'Artistas' },
  { to: '/perfil/siguiendo', label: 'Siguiendo' },
  { to: '/perfil/seguidores', label: 'Le siguen' },
  { to: '/perfil/ajustes', label: 'Ajustes' },
]

export function PerfilLayout() {
  const nav = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  // Deja la seccion activa a la vista cuando el menu hace scroll horizontal
  useEffect(() => {
    const el = nav.current?.querySelector<HTMLElement>('a.active')
    if (el && nav.current) nav.current.scrollTo({ left: Math.max(0, el.offsetLeft - 16) })
  }, [pathname])
  return (
    <div>
      <nav ref={nav} aria-label="Secciones del perfil" className="subnav">
        {SECTIONS.map((s) => (
          <NavLink
            key={s.to}
            to={s.to}
            end={s.end ?? false}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            {s.label}
          </NavLink>
        ))}
      </nav>
      <div>
        <Outlet />
      </div>
    </div>
  )
}
