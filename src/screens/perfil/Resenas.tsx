import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Async, MutationError, ReviewCard, Tabs } from '@/components/ui'
import { useDeleteReview, useReviews } from '@/queries'

export function Resenas() {
  const [scope, setScope] = useState<'mine' | 'friends'>('mine')
  const q = useReviews(scope)
  const del = useDeleteReview()
  return (
    <div>
      <h1>Reseñas</h1>
      <Tabs
        value={scope}
        onChange={setScope}
        options={[
          { value: 'mine', label: 'Mis reseñas' },
          { value: 'friends', label: 'De mis contactos' },
        ]}
      />
      <div className="mt-3">
        <Async
          query={q}
          isEmpty={(d) => d.length === 0}
          empty={
            scope === 'mine'
              ? 'Todavía no has escrito reseñas. Puedes hacerlo desde la ficha de un concierto al que fuiste.'
              : 'Tus contactos no han escrito reseñas.'
          }
        >
          {(list) => (
            <ul className="m-0 list-none p-0">
              {list.map((r) => (
                <ReviewCard
                  key={r.attendance.id}
                  r={r}
                  footer={
                    scope === 'mine' && (
                      <>
                        <Link to={`/conciertos/${r.gig.gig.id}`}>Editar</Link>{' '}
                        <button className="link" disabled={del.isPending} onClick={() => del.mutate(r.gig.gig.id)}>
                          Eliminar
                        </button>
                      </>
                    )
                  }
                />
              ))}
            </ul>
          )}
        </Async>
        <MutationError error={del.error} />
      </div>
    </div>
  )
}
