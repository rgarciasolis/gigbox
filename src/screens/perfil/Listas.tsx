import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Async, MutationError } from '@/components/ui'
import { useCreateList, useDeleteList, useLists, useUpdateList } from '@/queries'

export function Listas() {
  const q = useLists()
  const create = useCreateList()
  const update = useUpdateList()
  const del = useDeleteList()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  return (
    <div>
      <h1>Listas</h1>
      <form
        className="box"
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim()) return
          create.mutate(
            { title: title.trim(), description: description.trim() || null },
            {
              onSuccess: () => {
                setTitle('')
                setDescription('')
              },
            },
          )
        }}
      >
        <label htmlFor="title">Nueva lista</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
        <label htmlFor="desc">Descripción (opcional)</label>
        <input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button className="primary mt-2" disabled={!title.trim() || create.isPending}>
          Crear lista
        </button>
        <MutationError error={create.error} />
      </form>

      <div className="mt-3">
        <Async query={q} isEmpty={(d) => d.length === 0} empty="Todavía no tienes listas.">
          {(lists) => (
            <ul className="m-0 list-none p-0">
              {lists.map((l) => (
                <li key={l.id} className="border-b border-gray-300 py-3">
                  {editing === l.id ? (
                    <div className="row">
                      <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                      <button
                        className="primary"
                        disabled={!editTitle.trim() || update.isPending}
                        onClick={() =>
                          update.mutate({ id: l.id, title: editTitle.trim() }, { onSuccess: () => setEditing(null) })
                        }
                      >
                        Guardar
                      </button>
                      <button onClick={() => setEditing(null)}>Cancelar</button>
                    </div>
                  ) : (
                    <>
                      <Link to={`/listas/${l.id}`} className="font-bold">
                        {l.title}
                      </Link>{' '}
                      <span className="muted">({l.items.length} conciertos)</span>
                      {l.description && <div className="muted text-sm">{l.description}</div>}
                      <div className="row mt-2">
                        <button
                          onClick={() => {
                            setEditing(l.id)
                            setEditTitle(l.title)
                          }}
                        >
                          Renombrar
                        </button>
                        <button
                          disabled={del.isPending}
                          onClick={() => {
                            if (window.confirm(`¿Eliminar la lista "${l.title}"?`)) del.mutate(l.id)
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Async>
        <MutationError error={update.error ?? del.error} />
      </div>
    </div>
  )
}
