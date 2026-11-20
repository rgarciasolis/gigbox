import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Async, GigList, GigRow, GoingButton, LikeButton, Tabs, useDebounced } from '@/components/ui'
import type { GigFilters, TimeScope } from '@/domain/types'
import { useArtistSearch, useFacets, useGigSearch } from '@/queries'

const PAGE = 20

export function Conciertos() {
  const [params, setParams] = useSearchParams()
  const get = (k: string) => params.get(k) ?? ''
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    setParams(next, { replace: true })
    setVisible(PAGE)
  }

  const [visible, setVisible] = useState(PAGE)
  const [artistText, setArtistText] = useState(get('artistQuery'))
  const debounced = useDebounced(artistText)
  const suggestions = useArtistSearch(debounced)
  const facets = useFacets()

  const scope = (get('scope') || 'all') as TimeScope
  const filters: GigFilters = {
    scope,
    artistId: get('artistId') || undefined,
    artistQuery: get('artistQuery') || undefined,
    city: get('city') || undefined,
    venueId: get('venueId') || undefined,
    genre: get('genre') || undefined,
    dateFrom: get('dateFrom') || undefined,
    dateTo: get('dateTo') || undefined,
  }
  const results = useGigSearch(filters)
  const hasFilters = [...params.keys()].some((k) => k !== 'scope')

  return (
    <div>
      <h1>Conciertos</h1>

      <Tabs
        value={scope}
        onChange={(v) => set('scope', v === 'all' ? '' : v)}
        options={[
          { value: 'all', label: 'Todos' },
          { value: 'future', label: 'Futuros' },
          { value: 'past', label: 'Pasados' },
        ]}
      />

      <form className="box mt-3" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="artist">Artista</label>
        <input
          id="artist"
          value={artistText}
          placeholder="Escribe un artista"
          onChange={(e) => {
            setArtistText(e.target.value)
            const next = new URLSearchParams(params)
            next.delete('artistId')
            if (e.target.value) next.set('artistQuery', e.target.value)
            else next.delete('artistQuery')
            setParams(next, { replace: true })
            setVisible(PAGE)
          }}
        />
        {debounced.trim() && !get('artistId') && suggestions.data && suggestions.data.length > 0 && (
          <ul className="m-0 list-none p-0">
            {suggestions.data.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className="link"
                  onClick={() => {
                    setArtistText(a.name)
                    const next = new URLSearchParams(params)
                    next.set('artistId', a.id)
                    next.delete('artistQuery')
                    setParams(next, { replace: true })
                  }}
                >
                  {a.name}
                </button>{' '}
                <span className="muted">({a.genre})</span>
              </li>
            ))}
          </ul>
        )}

        <div className="row mt-2">
          <div>
            <label htmlFor="city">Ciudad</label>
            <select id="city" value={get('city')} onChange={(e) => set('city', e.target.value)}>
              <option value="">Todas</option>
              {facets.data?.cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="venue">Sala</label>
            <select id="venue" value={get('venueId')} onChange={(e) => set('venueId', e.target.value)}>
              <option value="">Todas</option>
              {facets.data?.venues
                .filter((v) => !get('city') || v.city === get('city'))
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.city})
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label htmlFor="genre">Estilo</label>
            <select id="genre" value={get('genre')} onChange={(e) => set('genre', e.target.value)}>
              <option value="">Todos</option>
              {facets.data?.genres.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="row">
          <div>
            <label htmlFor="from">Desde</label>
            <input id="from" type="date" value={get('dateFrom')} onChange={(e) => set('dateFrom', e.target.value)} />
          </div>
          <div>
            <label htmlFor="to">Hasta</label>
            <input id="to" type="date" value={get('dateTo')} onChange={(e) => set('dateTo', e.target.value)} />
          </div>
        </div>
        {hasFilters && (
          <p className="mt-2">
            <button
              type="button"
              onClick={() => {
                setArtistText('')
                setParams(scope === 'all' ? {} : { scope }, { replace: true })
              }}
            >
              Limpiar filtros
            </button>
          </p>
        )}
      </form>

      <div className="mt-4">
        <Async
          query={results}
          isEmpty={(d) => d.length === 0}
          empty={hasFilters ? 'Ningún concierto coincide con los filtros.' : 'No hay conciertos.'}
        >
          {(list) => (
            <>
              <p className="muted">{list.length} conciertos</p>
              <GigList>
                {list.slice(0, visible).map((s) => (
                  <GigRow
                    key={s.gig.id}
                    s={s}
                    actions={
                      <>
                        <GoingButton gig={s} />
                        <LikeButton gig={s} />
                      </>
                    }
                  />
                ))}
              </GigList>
              {visible < list.length && (
                <p className="mt-3">
                  <button onClick={() => setVisible(visible + PAGE)}>Mostrar más</button>
                </p>
              )}
            </>
          )}
        </Async>
      </div>
    </div>
  )
}
