// Adaptador REAL (fase real 1 en adelante). Aun no implementado.
//
// Para activarlo: VITE_DATA_ADAPTER=real y devolver aqui una implementacion de cada interfaz
// de src/domain/repositories.ts (por ejemplo contra Supabase). Las pantallas no cambian.
// Ver README.md y docs/ROADMAP.md.

import type { Repositories } from '@/domain/repositories'

export function createRealRepositories(): Repositories {
  throw new Error(
    'El adaptador real no esta implementado todavia. Usa VITE_DATA_ADAPTER=mock (ver README.md).',
  )
}
