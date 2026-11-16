import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ActivityRow } from '@/components/gig'
import { Async, Avatar, Tabs } from '@/components/ui'
import { useFeed, useFollow, useFollowing, useSuggestions, useUnfollow } from '@/data/hooks'
import type { User } from '@/domain/types'

function UserRow({ u, following }: { u: User; following: boolean }) {
  const follow = useFollow()
  const unfollow = useUnfollow()
  return (
    <li className="flex items-center gap-2 py-2">
      <Avatar user={u} size={36} />
      <Link to={`/u/${u.id}`} className="flex-1 hover:underline"><span className="font-medium">{u.displayName}</span> <span className="muted">@{u.handle} · {u.city}</span></Link>
      <button className="btn" disabled={follow.isPending || unfollow.isPending} onClick={() => (following ? unfollow.mutate(u.id) : follow.mutate(u.id))}>
        {following ? 'Dejar de seguir' : 'Seguir'}
      </button>
    </li>
  )
}

export default function FriendsPage() {
  const [tab, setTab] = useState<'feed' | 'following' | 'discover'>('feed')
  const feed = useFeed()
  const following = useFollowing()
  const suggestions = useSuggestions()
  return (
    <div>
      <h1 className="h1">Amigos</h1>
      <Tabs value={tab} onChange={setTab} options={[{ value: 'feed', label: 'Actividad' }, { value: 'following', label: 'Siguiendo' }, { value: 'discover', label: 'Descubrir' }]} />
      {tab === 'feed' && (
        <Async query={feed} empty="Sin actividad. Sigue a más gente en Descubrir.">
          {(l) => <ul className="divide-y divide-neutral-100">{l.map((a) => <ActivityRow key={a.activity.id} a={a} />)}</ul>}
        </Async>
      )}
      {tab === 'following' && (
        <Async query={following} empty="No sigues a nadie todavía.">
          {(l) => <ul className="divide-y divide-neutral-100">{l.map((u) => <UserRow key={u.id} u={u} following />)}</ul>}
        </Async>
      )}
      {tab === 'discover' && (
        <Async query={suggestions} empty="No hay sugerencias.">
          {(l) => <ul className="divide-y divide-neutral-100">{l.map((u) => <UserRow key={u.id} u={u} following={false} />)}</ul>}
        </Async>
      )}
    </div>
  )
}
