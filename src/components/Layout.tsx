import { NavLink, Outlet } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useFlag, useMe } from '@/data/hooks'
import { env } from '@/config/env'
import { resetMockData } from '@/data/mock/db'
import { getSimMode, setSimMode, type SimMode } from '@/data/mock/sim'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/perfil', label: 'Perfil' },
  { to: '/agenda', label: 'Agenda', plus: 'agenda' as const },
  { to: '/gigs', label: 'Gigs' },
  { to: '/suscripcion', label: 'Suscripción' },
]

function DevBar() {
  const qc = useQueryClient()
  if (env.dataAdapter !== 'mock') return null
  return (
    <div className="border-t border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
      <span className="mr-2 font-medium">Mock</span>
      <label className="mr-3">Simular:{' '}
        <select defaultValue={getSimMode()} className="rounded border border-neutral-300 px-1"
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
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col">
      <header className="border-b border-neutral-200 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Gigbox</span>
          <span className="muted">{me.data ? `${me.data.displayName} · ${agenda.enabled ? 'Plus' : 'Free'}` : ''}</span>
        </div>
        <nav className="-mx-1 mt-2 flex gap-1 overflow-x-auto text-sm" aria-label="Principal">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) => `whitespace-nowrap rounded px-2 py-1 ${isActive ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100'}`}>
              {l.label}{l.plus && !agenda.enabled ? ' (Plus)' : ''}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 px-3 py-4"><Outlet /></main>
      <DevBar />
    </div>
  )
}
