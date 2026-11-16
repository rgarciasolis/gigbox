export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
export const fmtDateLong = (iso: string) =>
  new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
export const fmtRating = (n: number | null) => (n === null ? '-' : n.toFixed(1).replace('.', ','))
export const stars = (n: number) => '★'.repeat(Math.floor(n)) + (n % 1 ? '½' : '')
export const initials = (name: string) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
