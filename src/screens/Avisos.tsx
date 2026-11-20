import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Async, GoingButton, Loading, MutationError, Tabs } from '@/components/ui'
import { formatDate, lineup, relativeTime } from '@/domain/format'
import type { NotificationTab, NotificationView } from '@/domain/types'
import { useFlag } from '@/flags'
import { useMarkAllRead, useMarkRead, useNotifications } from '@/queries'

export function Avisos() {
  const flag = useFlag('artistAlerts')
  const [picked, setPicked] = useState<NotificationTab | null>(null)
  if (flag.loading) return <Loading />
  // Sin Plus se abre en Interacciones; con Plus, en Artistas
  const tab: NotificationTab = picked ?? (flag.enabled ? 'artists' : 'interactions')

  return (
    <div>
      <h1>Avisos</h1>
      <Tabs
        value={tab}
        onChange={setPicked}
        options={[
          { value: 'artists', label: 'Artistas (Plus)' },
          { value: 'interactions', label: 'Interacciones' },
        ]}
      />
      <div className="mt-3">
        {tab === 'artists' && !flag.enabled ? <Locked /> : <Inbox key={tab} tab={tab} />}
      </div>
    </div>
  )
}

function Locked() {
  return (
    <div className="box">
      <p>
        Te avisamos cuando un artista que sigues anuncia un concierto cerca de ti. Es una función de Plus.
      </p>
      <p>
        <Link to="/perfil/ajustes/suscripcion">Ver suscripción</Link> ·{' '}
        <Link to="/perfil/artistas">Artistas que sigues</Link>
      </p>
    </div>
  )
}

function Inbox({ tab }: { tab: NotificationTab }) {
  const q = useNotifications(tab)
  const markAll = useMarkAllRead()
  const hasUnread = q.data?.some((v) => !v.notification.read) ?? false
  return (
    <>
      <div className="row mb-2">
        <button disabled={!hasUnread || markAll.isPending} onClick={() => markAll.mutate(tab)}>
          Marcar todo como leído
        </button>
      </div>
      <MutationError error={markAll.error} />
      <Async
        query={q}
        isEmpty={(d) => d.length === 0}
        empty={
          tab === 'artists'
            ? 'No hay avisos de artistas dentro de tu radio. Sigue artistas desde la ficha de un concierto o amplía el radio en Perfil > Ajustes.'
            : 'Todavía no tienes interacciones.'
        }
      >
        {(list) => (
          <ul className="m-0 list-none p-0">
            {list.map((v) => (
              <Item key={v.notification.id} v={v} />
            ))}
          </ul>
        )}
      </Async>
    </>
  )
}

function describe(v: NotificationView): { text: ReactNode; to: string } | null {
  const { notification: n, actor, gig, artist } = v
  switch (n.type) {
    case 'artist_gig_announced':
      if (!gig || !artist) return null
      return {
        text: (
          <>
            {artist.name} ha anunciado un concierto en {gig.venue.name}, {gig.venue.city} ·{' '}
            {formatDate(gig.gig.startsAt)}
          </>
        ),
        to: `/conciertos/${gig.gig.id}`,
      }
    case 'review_like':
      if (!gig || !actor) return null
      return {
        text: (
          <>
            {actor.displayName} ha dado like a tu reseña de {lineup(gig.artists)}
          </>
        ),
        to: `/conciertos/${gig.gig.id}`,
      }
    case 'new_follower':
      if (!actor) return null
      return { text: <>{actor.displayName} te ha empezado a seguir</>, to: `/u/${actor.id}` }
  }
}

function Item({ v }: { v: NotificationView }) {
  const markRead = useMarkRead()
  const d = describe(v)
  if (!d) return null
  const n = v.notification
  return (
    <li className="border-b border-gray-300 py-3">
      <Link
        to={d.to}
        className={n.read ? '' : 'font-bold'}
        onClick={() => {
          if (!n.read) markRead.mutate(n.id)
        }}
      >
        {!n.read && <span aria-label="Sin leer">● </span>}
        {d.text}
      </Link>
      <div className="muted">{relativeTime(n.createdAt)}</div>
      {n.type === 'artist_gig_announced' && v.gig && (
        <div className="row mt-2">
          <GoingButton gig={v.gig} />
        </div>
      )}
    </li>
  )
}
