export type DataAdapter = 'mock' | 'real'

const num = (v: string | undefined, d: number) => (v && !Number.isNaN(Number(v)) ? Number(v) : d)

export const env = {
  dataAdapter: ((import.meta.env.VITE_DATA_ADAPTER as string | undefined) ?? 'mock') as DataAdapter,
  /** '' = depende del usuario; 'true'/'false' = fuerza Plus. */
  forcePlus: (import.meta.env.VITE_FORCE_PLUS as string | undefined) ?? '',
  mockLatencyMin: num(import.meta.env.VITE_MOCK_LATENCY_MIN as string | undefined, 300),
  mockLatencyMax: num(import.meta.env.VITE_MOCK_LATENCY_MAX as string | undefined, 600),
}
