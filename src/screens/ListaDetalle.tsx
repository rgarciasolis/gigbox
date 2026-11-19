import { Link, useParams } from 'react-router-dom'
import { Async, GigList, GigRow, MutationError } from '@/components/ui'
import { useCurrentUser, useList, useRemoveFromList } from '@/queries'

export function ListaDetalle() {
  const { id = '' } = useParams()
  const q = useList(id)
  const remove = useRemoveFromList()
  const me = useCurrentUser()
  return (
    <Async query={q}>
      {({ list, entries, owner }) => {
        const mine = me.data?.id === list.userId
        return (
          <div>
            <p>
              <Link to="/perfil/listas">Volver a Listas</Link>
            </p>
            <h1>{list.title}</h1>
            <p className="muted">
              Lista de <Link to={`/u/${owner.id}`}>{owner.displayName}</Link>
            </p>
            {list.description && <p>{list.description}</p>}
            {entries.length === 0 ? (
              <p className="muted">Esta lista está vacía. Añade conciertos desde su ficha.</p>
            ) : (
              <GigList>
                {entries.map((e) => (
                  <GigRow
                    key={e.gig.gig.id}
                    s={e.gig}
                    actions={
                      mine && (
                        <button
                          disabled={remove.isPending}
                          onClick={() => remove.mutate({ listId: list.id, gigId: e.gig.gig.id })}
                        >
                          Quitar de la lista
                        </button>
                      )
                    }
                  />
                ))}
              </GigList>
            )}
            <MutationError error={remove.error} />
          </div>
        )
      }}
    </Async>
  )
}
