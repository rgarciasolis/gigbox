export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
export const fmtDateLong = (iso: string) =>
  new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
export const fmtRating = (n: number | null) => (n === null ? '-' : n.toFixed(1).replace('.', ','))
export const stars = (n: number) => '★'.repeat(Math.floor(n)) + (n % 1 ? '½' : '')
export const initials = (name: string) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
const MONTHS_TILE = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
/** Formato de fecha de las tarjetas de Figma: 12·Nov·26 */
export const fmtTileDate = (iso: string) => {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}·${MONTHS_TILE[d.getMonth()]}·${String(d.getFullYear()).slice(-2)}`
}
