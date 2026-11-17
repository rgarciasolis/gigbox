import { Async } from '@/components/ui'
import { useMe, useSetPlus } from '@/data/hooks'
import { env } from '@/config/env'

export default function SubscriptionPage() {
  const me = useMe()
  const setPlus = useSetPlus()
  return (
    <div className="max-w-xl">
      <h1 className="h1">Suscripción</h1>
      <p className="muted mb-3">Pantalla simulada: no hay pagos reales. Alterna el plan para probar los dos estados.</p>
      {env.forcePlus && <p className="card mb-3 text-sm">VITE_FORCE_PLUS={env.forcePlus} está forzando el flag; el interruptor no tendrá efecto visible.</p>}
      <Async query={me}>
        {(u) => (
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { plus: false, name: 'Free', price: '0 €', feats: ['Registro de conciertos', 'Notas y reseñas', 'Gigslists y tags', 'Amigos y feed'] },
              { plus: true, name: 'Plus', price: '3,99 € / mes (ficticio)', feats: ['Todo lo de Free', 'Agenda de tus artistas y tu ciudad', 'Importación masiva desde emails'] },
            ].map((p) => (
              <div key={p.name} className={`card ${u.plus === p.plus ? 'border-green-700' : ''}`}>
                <h2 className="font-semibold">{p.name} {u.plus === p.plus && <span className="muted">(actual)</span>}</h2>
                <p className="text-sm">{p.price}</p>
                <ul className="muted my-2 list-disc pl-4">{p.feats.map((f) => <li key={f}>{f}</li>)}</ul>
                {u.plus !== p.plus && (
                  <button className="btn btn-primary" disabled={setPlus.isPending} onClick={() => setPlus.mutate(p.plus)}>
                    {setPlus.isPending ? 'Aplicando…' : p.plus ? 'Activar Plus' : 'Volver a Free'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Async>
      {setPlus.isError && <p className="mt-2 text-sm text-red-700" role="alert">{(setPlus.error as Error).message}</p>}
    </div>
  )
}
