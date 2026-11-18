import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { User } from '@/domain/types'
import { fmtRating, initials, stars } from '@/lib'

export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return <p className="muted py-6 text-center" role="status">{label}</p>
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800" role="alert">
      <p>{error instanceof Error ? error.message : 'Algo salió mal.'}</p>
      {onRetry && <button className="btn mt-2" onClick={onRetry}>Reintentar</button>}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded bg-green-50 p-6 text-center text-sm text-zinc-700">{children}</p>
}

/** Gestiona carga / error / vacio de una query. Las pantallas lo usan para todo. */
export function Async<T>({
  query, empty, isEmpty, children,
}: {
  query: UseQueryResult<T>
  empty?: ReactNode
  isEmpty?: (d: T) => boolean
  children: (data: T) => ReactNode
}) {
  if (query.isLoading || query.isPending) return <Loading />
  if (query.isError) return <ErrorBox error={query.error} onRetry={() => query.refetch()} />
  const data = query.data as T
  const emptyCheck = isEmpty ?? ((d: T) => Array.isArray(d) && d.length === 0)
  if (empty !== undefined && emptyCheck(data)) return <Empty>{empty}</Empty>
  return <>{children(data)}</>
}

export function Avatar({ user, size = 24 }: { user: User; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-green-600 font-heading font-normal uppercase leading-none text-zinc-950"
      style={{ width: size, height: size, fontSize: Math.max(8, Math.round(size * 0.46)) }}
      aria-hidden
    >
      {initials(user.displayName)}
    </span>
  )
}

/** Cabecera de seccion de Figma: eyebrow en mayusculas + titular Kurrent italico de 48px. */
export function SectionHeader({ eyebrow, title, as: Tag = 'h2', className = '' }: { eyebrow?: string; title: string; as?: 'h1' | 'h2'; className?: string }) {
  return (
    <header className={className}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Tag className="section-title">{title}</Tag>
    </header>
  )
}

export function UserLink({ user }: { user: User }) {
  return <Link to={`/u/${user.id}`} className="hover:underline">{user.displayName}</Link>
}

export function Rating({ value }: { value: number | null }) {
  if (value === null) return <span className="muted">Sin nota</span>
  return <span title={`${fmtRating(value)} / 5`}><span className="text-green-600">{stars(value)}</span> <span className="text-sm text-zinc-700">{fmtRating(value)}</span></span>
}

const STEPS = Array.from({ length: 10 }, (_, i) => (i + 1) / 2)
export function RatingInput({ value, onChange, disabled }: { value: number | null; onChange: (v: number | null) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-1" role="radiogroup" aria-label="Nota">
      {STEPS.map((s) => (
        <button
          key={s} type="button" disabled={disabled} role="radio" aria-checked={value === s}
          onClick={() => onChange(s)}
          className={`rounded border px-2 py-1 text-sm ${value === s ? 'border-green-700 bg-green-700 text-zinc-50' : 'border-zinc-300 bg-white hover:bg-zinc-100'}`}
        >
          {fmtRating(s)}
        </button>
      ))}
      {value !== null && <button type="button" disabled={disabled} className="muted ml-1 underline" onClick={() => onChange(null)}>quitar</button>}
    </div>
  )
}

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="mb-6 flex flex-wrap justify-center gap-1">
      {options.map((o) => (
        <button key={o.value} aria-pressed={value === o.value} onClick={() => onChange(o.value)}
          className={`rounded-sm px-3 py-2 text-sm uppercase ${value === o.value ? 'bg-green-600 text-zinc-50' : 'text-zinc-800 hover:bg-zinc-100'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
