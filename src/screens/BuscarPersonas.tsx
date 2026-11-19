import { useState } from 'react'
import { Async, UserRow, useDebounced } from '@/components/ui'
import { useSearchUsers } from '@/queries'

export function BuscarPersonas() {
  const [text, setText] = useState('')
  const query = useDebounced(text.trim())
  const q = useSearchUsers(query)
  return (
    <div>
      <h1>Buscar personas</h1>
      <label htmlFor="q">Nombre o usuario</label>
      <input id="q" value={text} onChange={(e) => setText(e.target.value)} placeholder="Buscar..." />
      <div className="mt-3">
        <Async query={q} isEmpty={(d) => d.length === 0} empty="No se ha encontrado a nadie.">
          {(list) => (
            <ul className="m-0 list-none p-0">
              {list.map((s) => (
                <UserRow key={s.user.id} s={s} />
              ))}
            </ul>
          )}
        </Async>
      </div>
    </div>
  )
}
