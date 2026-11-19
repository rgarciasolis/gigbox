// Utilidades de formato (puras, sin acceso a datos).

const dateFmt = new Intl.DateTimeFormat('es-ES', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const timeFmt = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' })

export const formatDate = (iso: string) => dateFmt.format(new Date(iso))
export const formatTime = (iso: string) => timeFmt.format(new Date(iso))
export const formatDateTime = (iso: string) => `${formatDate(iso)}, ${formatTime(iso)}`

/** 4.5 -> "4,5" */
export const formatRating = (n: number | null | undefined) =>
  n === null || n === undefined ? '-' : (Math.round(n * 10) / 10).toString().replace('.', ',')

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60_000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.round(h / 24)
  if (d < 30) return `hace ${d} d`
  const mo = Math.round(d / 30)
  if (mo < 12) return `hace ${mo} meses`
  return `hace ${Math.round(mo / 12)} a`
}

export const RATING_STEPS = Array.from({ length: 10 }, (_, i) => (i + 1) / 2)

/** YYYY-MM-DD en hora local. */
export function localDay(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const lineup = (artists: { name: string }[]) => artists.map((a) => a.name).join(' + ')
