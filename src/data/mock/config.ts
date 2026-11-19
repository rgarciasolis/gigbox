// Configuracion de la simulacion del adaptador mock. Se guarda en localStorage y se edita
// desde Perfil > Ajustes > Herramientas de desarrollo (solo visible con VITE_DATA_ADAPTER=mock).

export interface MockConfig {
  /** Latencia simulada de 300 a 600 ms en cada llamada. */
  latency: boolean
  /** Probabilidad (0 a 1) de que una llamada falle con un error simulado. */
  errorRate: number
  /** Las listas devuelven vacio, para probar los estados vacios. */
  empty: boolean
  /** El usuario dummy no sigue a nadie, para probar el Home sin contactos. */
  noContacts: boolean
}

const KEY = 'concis.mock.config.v1'

export const DEFAULT_CONFIG: MockConfig = {
  latency: true,
  errorRate: 0,
  empty: false,
  noContacts: false,
}

export function getMockConfig(): MockConfig {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    // ignorar: localStorage no disponible
  }
  return { ...DEFAULT_CONFIG }
}

export function setMockConfig(patch: Partial<MockConfig>): MockConfig {
  const next = { ...getMockConfig(), ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // ignorar
  }
  return next
}
