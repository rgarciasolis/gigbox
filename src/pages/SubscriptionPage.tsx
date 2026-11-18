import { Async, SectionHeader } from '@/components/ui'
import { useMe, useSetPlus } from '@/data/hooks'
import { env } from '@/config/env'

export default function SubscriptionPage() {
  const me = useMe()
  const setPlus = useSetPlus()
  return (
    <div className="mx-auto max-w-3xl">
      <SectionHeader as="h1" eyebrow="Pantalla simulada: no hay pagos reales" title="Suscripción" />
      {env.forcePlus && <p className="card mb-4 text-sm">VITE_FORCE_PLUS={env.forcePlus} está forzando el flag; el interruptor no tendrá efecto visible.</p>}
      <Async query={me}>
        {(u) => (
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { plus: false, name: 'Free', price: '0 €', feats: ['Registro de conciertos', 'Notas y reseñas', 'Gigslists y tags', 'Amigos y feed'] },
              { plus: true, name: 'Plus', price: '3,99 € / mes (ficticio)', feats: ['Todo lo de Free', 'Agenda de tus artistas y tu ciudad', 'Importación masiva desde emails'] },
            ].map((p) => (
              <div key={p.name} className={`card ${u.plus === p.plus ? 'ring-2 ring-green-600' : ''}`}>
                <h2 className="font-heading text-3xl font-bold text-[#151515]">{p.name} {u.plus === p.plus && <span className="font-body text-sm font-normal text-zinc-500">(actual)</span>}</h2>
                <p className="text-lg">{p.price}</p>
                <ul className="my-3 list-disc pl-5 text-lg text-zinc-700">{p.feats.map((f) => <li key={f}>{f}</li>)}</ul>
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
