import { Link, Outlet, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useFlag, useMe } from '@/data/hooks'
import { Avatar } from './ui'
import { env } from '@/config/env'
import { resetMockData } from '@/data/mock/db'
import { getSimMode, setSimMode, type SimMode } from '@/data/mock/sim'

/** Navegacion principal de Figma: CONCIERTOS · AGENDA · SUSCRIPCION (el perfil cuelga del chip de usuario). */
const links = [
  { to: '/', label: 'Conciertos', match: (p: string) => p === '/' || p.startsWith('/gigs') },
  { to: '/agenda', label: 'Agenda', plus: 'agenda' as const, match: (p: string) => p.startsWith('/agenda') },
  { to: '/suscripcion', label: 'Suscripción', match: (p: string) => p.startsWith('/suscripcion') },
]

const footerLinks = [
  { to: '/gigs', label: 'Gigs' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/perfil/gigslists', label: 'Gigslists' },
  { to: '/perfil/tags', label: 'Tags' },
  { to: '/perfil/friends', label: 'Friends' },
  { to: '/import', label: 'Importar' },
]

function DevBar() {
  const qc = useQueryClient()
  if (env.dataAdapter !== 'mock') return null
  return (
    <div className="border-t border-zinc-200 px-5 py-2 text-xs text-zinc-700">
      <span className="mr-2 font-medium">Mock</span>
      <label className="mr-3">Simular:{' '}
        <select defaultValue={getSimMode()} className="rounded border border-zinc-300 bg-white px-1"
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
  const profileActive = pathname.startsWith('/perfil') || pathname.startsWith('/u/')
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Saltar al contenido</a>
      <header className={home ? 'absolute inset-x-0 top-0 z-10' : ''}>
        <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-3 px-5 py-5">
          <Link to="/" className="rounded-[1px] bg-green-600 px-1 py-1 font-heading text-[21px] font-bold uppercase leading-none text-green-950" aria-label="Kontz, inicio">KONTZ</Link>
          <nav className="flex flex-wrap items-center gap-x-2 bg-zinc-50 p-0.5" aria-label="Principal">
            {me.data && (
              <Link to="/perfil" aria-current={profileActive ? 'page' : undefined}
                className={`flex items-center gap-2.5 whitespace-nowrap rounded-sm px-2.5 py-1 text-xs uppercase text-zinc-800 ${profileActive ? 'ring-1 ring-green-600' : 'hover:bg-zinc-100'}`}>
                <Avatar user={me.data} size={18} />
                <span>{me.data.displayName}{agenda.enabled ? ' · Plus' : ''}</span>
              </Link>
            )}
            {links.map((l) => {
              const active = l.match(pathname)
              return (
                <Link key={l.to} to={l.to} aria-current={active ? 'page' : undefined}
                  className={`whitespace-nowrap rounded-sm px-2.5 py-2.5 text-xs uppercase ${active ? 'bg-green-600 text-zinc-50' : 'text-zinc-800 hover:bg-zinc-100'}`}>
                  {l.label}{l.plus && !agenda.enabled ? ' (Plus)' : ''}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      <main id="contenido" className={`flex-1 ${home ? '' : 'mx-auto w-full max-w-page px-5 pb-16 pt-4'}`}><Outlet /></main>
      <footer className="mx-auto w-full max-w-page px-5 pb-6">
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1 border-t border-zinc-200 pt-5 text-xs uppercase text-zinc-500" aria-label="Secundaria">
          {footerLinks.map((l) => <Link key={l.to} to={l.to} className="hover:text-zinc-950 hover:underline">{l.label}</Link>)}
        </nav>
      </footer>
      <DevBar />
    </div>
  )
}
