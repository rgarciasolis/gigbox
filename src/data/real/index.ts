// Adaptador REAL: pendiente (ver docs/ROADMAP.md, Fase 1 y siguientes).
// Cada repositorio debe implementar la interfaz de ../repositories. Hasta entonces,
// cualquier llamada lanza un error claro. Sustituye cada stub por su implementacion real
// (p. ej. Supabase) sin tocar pantallas ni hooks.
import type { Repositories } from '../repositories'

function notImplemented<T extends object>(name: string): T {
  return new Proxy({} as T, {
    get: (_t, method) => () => {
      throw new Error(`Adaptador real no implementado: ${name}.${String(method)}(). Usa VITE_DATA_ADAPTER=mock.`)
    },
  })
}

export function createRealRepositories(): Repositories {
  return {
    gigs: notImplemented('GigRepository'),
    attendances: notImplemented('AttendanceRepository'),
    gigslists: notImplemented('GigslistRepository'),
    profiles: notImplemented('ProfileRepository'),
    friends: notImplemented('FriendRepository'),
    tags: notImplemented('TagRepository'),
    agenda: notImplemented('AgendaProvider'),
    imports: notImplemented('ImportService'),
  }
}
