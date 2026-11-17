import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useFlag, useMe } from '@/data/hooks'
import { Avatar } from './ui'
import { env } from '@/config/env'
import { resetMockData } from '@/data/mock/db'
import { getSimMode, setSimMode, type SimMode } from '@/data/mock/sim'

const links = [
  { to: '/', label: 'Conciertos', end: true },
  { to: '/perfil', label: 'Perfil' },
  { to: '/agenda', label: 'Agenda', plus: 'agenda' as const },
  { to: '/gigs', label: 'Gigs' },
  { to: '/suscripcion', label: 'Suscripción' },
]

function DevBar() {
  const qc = useQueryClient()
  if (env.dataAdapter !== 'mock') return null
  return (
    <div className="border-t border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
      <span className="mr-2 font-medium">Mock</span>
      <label className="mr-3">Simular:{' '}
        <select defaultValue={getSimMode()} className="rounded border border-zinc-300 px-1"
          onChange={(e) => { setSimMode(e.target.value as SimMode); qc.invalidateQueries() }}>
          <option value="ok">datos normales</option>
          <option value="empty">listas vacías</option>
          <option value="error">errores</option>
        </select>
      </label>
      <button className="underline" onClick={() => { resetMockData(); localStorage.removeItem('gigbox.db.v1'); location.reload() }}>Restablecer datos</button>
    </div>
  )
}

export default function Layout() {
  const me = useMe()
  const agenda = useFlag('agenda')
  const { pathname } = useLocation()
  const home = pathname === '/'
  return (
    <div className="flex min-h-screen flex-col">
      <header className={home ? 'absolute inset-x-0 top-0 z-10' : 'border-b border-zinc-200 bg-white'}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-3 py-3">
          <Link to="/" className="rounded-sm bg-green-400 px-1.5 py-0.5 font-heading text-xl font-bold leading-none tracking-wide text-green-950">KONTZ</Link>
          <nav className="flex items-center gap-1 overflow-x-auto rounded-sm bg-white p-1 text-xs uppercase shadow-sm" aria-label="Principal">
            {me.data && (
              <Link to="/perfil" className="mr-1 flex items-center gap-1.5 whitespace-nowrap px-2 py-1.5 text-zinc-700">
                <Avatar user={me.data} size={16} />
                <span>{me.data.displayName}{agenda.enabled ? ' · Plus' : ''}</span>
              </Link>
            )}
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({ isActive }) => `whitespace-nowrap px-3 py-1.5 ${isActive ? 'bg-green-600 text-white' : 'text-zinc-800 hover:bg-zinc-100'}`}>
                {l.label}{l.plus && !agenda.enabled ? ' (Plus)' : ''}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className={`flex-1 ${home ? '' : 'mx-auto w-full max-w-5xl px-3 py-6'}`}><Outlet /></main>
      <DevBar />
    </div>
  )
}
