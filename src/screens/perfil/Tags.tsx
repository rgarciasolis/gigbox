import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Async, MutationError } from '@/components/ui'
import { useCreateTag, useRemoveTag, useRenameTag, useTags } from '@/queries'

export function Tags() {
  const q = useTags()
  const create = useCreateTag()
  const rename = useRenameTag()
  const remove = useRemoveTag()
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  return (
    <div>
      <h1>Tags</h1>
      <p className="muted">Etiquetas propias para organizar tu histórico.</p>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          create.mutate(name.trim(), { onSuccess: () => setName('') })
        }}
      >
        <input aria-label="Nuevo tag" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nuevo tag" />
        <button className="primary" disabled={!name.trim() || create.isPending}>
          Crear
        </button>
      </form>
      <MutationError error={create.error} />

      <div className="mt-3">
        <Async query={q} isEmpty={(d) => d.length === 0} empty="Todavía no tienes tags.">
          {(tags) => (
            <ul className="m-0 list-none p-0">
              {tags.map((t) => (
                <li key={t.id} className="row border-b border-gray-300 py-2">
                  {editing === t.id ? (
                    <>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                      <button
                        className="primary"
                        disabled={!editName.trim() || rename.isPending}
                        onClick={() =>
                          rename.mutate({ id: t.id, name: editName.trim() }, { onSuccess: () => setEditing(null) })
                        }
                      >
                        Guardar
                      </button>
                      <button onClick={() => setEditing(null)}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <Link to={`/perfil/historico?tag=${t.id}`} className="grow">
                        {t.name}
                      </Link>
                      <button
                        onClick={() => {
                          setEditing(t.id)
                          setEditName(t.name)
                        }}
                      >
                        Renombrar
                      </button>
                      <button disabled={remove.isPending} onClick={() => remove.mutate(t.id)}>
                        Eliminar
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Async>
        <MutationError error={rename.error ?? remove.error} />
      </div>
    </div>
  )
}
