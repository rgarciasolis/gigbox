// Feature flags. Las funciones Plus se activan segun la suscripcion del usuario.
// En el MVP0 la suscripcion es simulada (Perfil > Ajustes > Suscripcion).

import { useSubscription } from '@/queries'

export type FlagName = 'artistAlerts'

/** Flags que dependen de Plus. Anadir aqui nuevas funciones Plus. */
const REQUIRES_PLUS: Record<FlagName, boolean> = {
  artistAlerts: true,
}

export function useFlag(name: FlagName): { enabled: boolean; loading: boolean } {
  const { data, isPending } = useSubscription()
  if (isPending) return { enabled: false, loading: true }
  return { enabled: !REQUIRES_PLUS[name] || !!data?.plus, loading: false }
}
