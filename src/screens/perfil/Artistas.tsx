import { Async, FollowArtistButton } from '@/components/ui'
import { useFollowedArtists } from '@/queries'

export function Artistas() {
  const q = useFollowedArtists()
  return (
    <div>
      <h1>Artistas que sigues</h1>
      <Async
        query={q}
        isEmpty={(d) => d.length === 0}
        empty="No sigues a ningún artista todavía. Puedes seguirlos desde la ficha de un concierto."
      >
        {(list) => (
          <ul className="m-0 list-none p-0">
            {list.map((a) => (
              <li key={a.id} className="row border-b border-gray-300 py-3">
                <div className="grow">
                  <div className="font-bold">{a.name}</div>
                  <div className="muted">{a.genre}</div>
                </div>
                <FollowArtistButton artistId={a.id} />
              </li>
            ))}
          </ul>
        )}
      </Async>
    </div>
  )
}
