// Unico punto donde se elige el adaptador (VITE_DATA_ADAPTER).
import { env } from '@/config/env'
import { createMockRepositories } from './mock/repos'
import { createRealRepositories } from './real'
import type { Repositories } from './repositories'

export const repos: Repositories = env.dataAdapter === 'real' ? createRealRepositories() : createMockRepositories()
