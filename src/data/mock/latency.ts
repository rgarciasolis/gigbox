import { getMockConfig } from './config'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Envuelve una operacion del mock con latencia (300 a 600 ms) y fallos simulados. */
export async function call<T>(fn: () => T): Promise<T> {
  const cfg = getMockConfig()
  if (cfg.latency) await sleep(300 + Math.random() * 300)
  if (cfg.errorRate > 0 && Math.random() < cfg.errorRate) {
    throw new Error('Error simulado: no se pudo completar la operacion.')
  }
  return fn()
}
