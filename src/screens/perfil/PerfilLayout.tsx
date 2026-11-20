import { NavLink, Outlet } from 'react-router-dom'

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
  return (
    <div>
      <nav aria-label="Secciones del perfil" className="subnav">
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
