// Punto unico de acceso a la capa de datos. El adaptador se elige con VITE_DATA_ADAPTER.

import { createContext, useContext, type ReactNode } from 'react'
import type { Repositories } from '@/domain/repositories'
import { createMockRepositories } from './mock'
import { createRealRepositories } from './real'

export type DataAdapter = 'mock' | 'real'

export const DATA_ADAPTER: DataAdapter =
  import.meta.env.VITE_DATA_ADAPTER === 'real' ? 'real' : 'mock'

export function createRepositories(): Repositories {
  return DATA_ADAPTER === 'real' ? createRealRepositories() : createMockRepositories()
}

const RepositoriesContext = createContext<Repositories | null>(null)

export function RepositoriesProvider({
  repositories,
  children,
}: {
  repositories: Repositories
  children: ReactNode
}) {
  return <RepositoriesContext.Provider value={repositories}>{children}</RepositoriesContext.Provider>
}

export function useRepositories(): Repositories {
  const repos = useContext(RepositoriesContext)
  if (!repos) throw new Error('useRepositories debe usarse dentro de RepositoriesProvider')
  return repos
}
