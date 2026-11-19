import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getMockConfig, setMockConfig, type MockConfig } from './config'
import { resetMockState } from './db'
import { generateTestNotification } from './notifications'

/** Panel para simular latencia, errores y listas vacías. Solo se carga con el adaptador mock. */
export default function MockDevPanel() {
  const qc = useQueryClient()
  const [cfg, setCfg] = useState<MockConfig>(getMockConfig())

  const change = (patch: Partial<MockConfig>) => {
    setCfg(setMockConfig(patch))
    qc.invalidateQueries()
  }

  return (
    <div className="box">
      <p className="muted">Datos de ejemplo guardados en este navegador. Estos ajustes no existen con el adaptador real.</p>
      <label style={{ fontWeight: 400 }}>
        <input type="checkbox" checked={cfg.latency} onChange={(e) => change({ latency: e.target.checked })} /> Latencia
        simulada (300-600 ms)
      </label>
      <label style={{ fontWeight: 400 }}>
        <input type="checkbox" checked={cfg.empty} onChange={(e) => change({ empty: e.target.checked })} /> Listas vacías
      </label>
      <label style={{ fontWeight: 400 }}>
        <input type="checkbox" checked={cfg.noContacts} onChange={(e) => change({ noContacts: e.target.checked })} /> Sin
        contactos (Home en modo ciudad)
      </label>
      <label htmlFor="err">Probabilidad de error: {Math.round(cfg.errorRate * 100)}%</label>
      <input
        id="err"
        type="range"
        min={0}
        max={1}
        step={0.1}
        value={cfg.errorRate}
        onChange={(e) => change({ errorRate: Number(e.target.value) })}
      />
      <div className="mt-2">
        <button
          onClick={() => {
            if (generateTestNotification() === null) window.alert('No quedan conciertos futuros sin aviso.')
            qc.invalidateQueries()
          }}
        >
          Generar aviso de prueba
        </button>{' '}
        <button
          onClick={() => {
            if (window.confirm('Se borrarán tus cambios y volverás a los datos iniciales. ¿Continuar?')) resetMockState()
          }}
        >
          Restablecer datos de ejemplo
        </button>
      </div>
    </div>
  )
}
