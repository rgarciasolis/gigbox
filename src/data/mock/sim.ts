import { env } from '@/config/env'

export type SimMode = 'ok' | 'error' | 'empty'
const KEY = 'gigbox.sim'

export function getSimMode(): SimMode {
  const v = localStorage.getItem(KEY)
  return v === 'error' || v === 'empty' ? v : 'ok'
}
export function setSimMode(m: SimMode) {
  localStorage.setItem(KEY, m)
}

export class MockError extends Error {}

const wait = () =>
  new Promise<void>((r) => setTimeout(r, env.mockLatencyMin + Math.random() * (env.mockLatencyMax - env.mockLatencyMin)))

/** Latencia simulada + modo de error. Para lecturas. */
export async function simRead<T>(fn: () => T, empty?: T): Promise<T> {
  await wait()
  const mode = getSimMode()
  if (mode === 'error') throw new MockError('Error simulado: no se pudo cargar (modo error activo).')
  if (mode === 'empty' && empty !== undefined) return empty
  // Clon: el "servidor" nunca comparte referencias con la cache de la UI.
  return structuredClone(fn())
}

/** Latencia simulada. Las escrituras fallan tambien en modo error. */
export async function simWrite<T>(fn: () => T): Promise<T> {
  await wait()
  if (getSimMode() === 'error') throw new MockError('Error simulado: no se pudo guardar (modo error activo).')
  return structuredClone(fn())
}
