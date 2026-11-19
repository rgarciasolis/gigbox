import { Async } from '@/components/ui'
import { formatRating } from '@/domain/format'
import { useStats } from '@/queries'

export function Estadisticas() {
  const q = useStats()
  return (
    <div>
      <h1>Estadísticas</h1>
      <Async
        query={q}
        isEmpty={(d) => d.byYear.length === 0}
        empty="Aún no hay datos. Marca conciertos como Fui para ver tus estadísticas."
      >
        {(s) => (
          <>
            <p>Nota media que das: {formatRating(s.avgRating)}</p>

            <h2>Conciertos por año</h2>
            <Table head={['Año', 'Conciertos']} rows={s.byYear.map((y) => [String(y.year), String(y.count)])} />

            <h2>Artistas más vistos</h2>
            <Table head={['Artista', 'Veces']} rows={s.topArtists.map((a) => [a.artist.name, String(a.count)])} />

            <h2>Salas más visitadas</h2>
            <Table head={['Sala', 'Veces']} rows={s.topVenues.map((v) => [v.venue.name, String(v.count)])} />

            <h2>Ciudades</h2>
            <Table head={['Ciudad', 'Conciertos']} rows={s.topCities.map((c) => [c.city, String(c.count)])} />

            <h2>Géneros</h2>
            <Table head={['Género', 'Conciertos']} rows={s.topGenres.map((g) => [g.genre, String(g.count)])} />
          </>
        )}
      </Async>
    </div>
  )
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h} className="border-b border-black py-1">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j} className="border-b border-gray-300 py-1">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
