import { Link, useSearchParams } from 'react-router-dom'
import { Async, GigList, GigRow, LikeButton } from '@/components/ui'
import { formatRating } from '@/domain/format'
import { useMyAttendances, useTags } from '@/queries'

export function Historico() {
  const [params, setParams] = useSearchParams()
  const tagId = params.get('tag') ?? undefined
  const q = useMyAttendances(tagId)
  const tags = useTags()
  return (
    <div>
      <h1>Histórico</h1>
      <label htmlFor="tag">Filtrar por tag</label>
      <select
        id="tag"
        value={tagId ?? ''}
        onChange={(e) => setParams(e.target.value ? { tag: e.target.value } : {})}
      >
        <option value="">Todos</option>
        {tags.data?.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <div className="mt-3">
        <Async
          query={q}
          isEmpty={(d) => d.length === 0}
          empty={
            tagId ? (
              'Ningún concierto tiene este tag.'
            ) : (
              <>
                Todavía no has marcado ningún concierto. <Link to="/conciertos?scope=past">Buscar conciertos pasados</Link>
              </>
            )
          }
        >
          {(list) => (
            <GigList>
              {list.map((a) => (
                <GigRow
                  key={a.attendance.id}
                  s={a.gig}
                  note={
                    <>
                      Tu nota: {formatRating(a.attendance.rating)}
                      {a.tags.length > 0 && <> · {a.tags.map((t) => t.name).join(', ')}</>}
                    </>
                  }
                  actions={<LikeButton gig={a.gig} />}
                />
              ))}
            </GigList>
          )}
        </Async>
      </div>
    </div>
  )
}
