import { Link } from 'react-router-dom'
import { Async, UserRow } from '@/components/ui'
import { useCurrentUser, useFollowers, useFollowing } from '@/queries'
import type { UserSummary } from '@/domain/types'
import type { UseQueryResult } from '@tanstack/react-query'

function List({ query, empty }: { query: UseQueryResult<UserSummary[]>; empty: React.ReactNode }) {
  return (
    <Async query={query} isEmpty={(d) => d.length === 0} empty={empty}>
      {(list) => (
        <ul className="m-0 list-none p-0">
          {list.map((s) => (
            <UserRow key={s.user.id} s={s} />
          ))}
        </ul>
      )}
    </Async>
  )
}

export function Siguiendo() {
  const me = useCurrentUser()
  return (
    <div>
      <h1>Siguiendo</h1>
      <p>
        <Link to="/personas">Buscar personas</Link>
      </p>
      <Async query={me}>
        {(u) => <SiguiendoList id={u.id} />}
      </Async>
    </div>
  )
}

function SiguiendoList({ id }: { id: string }) {
  const q = useFollowing(id)
  return <List query={q} empty="No sigues a nadie todavía." />
}

export function Seguidores() {
  const me = useCurrentUser()
  return (
    <div>
      <h1>Le siguen</h1>
      <Async query={me}>
        {(u) => <SeguidoresList id={u.id} />}
      </Async>
    </div>
  )
}

function SeguidoresList({ id }: { id: string }) {
  const q = useFollowers(id)
  return <List query={q} empty="Nadie te sigue todavía." />
}
