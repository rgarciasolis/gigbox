import type { User } from '@/domain/types'
import { env } from './env'

export type FeatureFlag = 'agenda' | 'bulkImport'

/** Ambas funciones Plus cuelgan del plan del usuario (o de VITE_FORCE_PLUS). */
export function isFlagEnabled(_flag: FeatureFlag, user: User | undefined): boolean {
  if (env.forcePlus === 'true') return true
  if (env.forcePlus === 'false') return false
  return !!user?.plus
}
