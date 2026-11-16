import { useState } from 'react'
import { ReviewCard } from '@/components/gig'
import { Async, Tabs } from '@/components/ui'
import { useReviews } from '@/data/hooks'

export default function ReviewsPage() {
  const [scope, setScope] = useState<'mine' | 'friends'>('mine')
  const q = useReviews(scope)
  return (
    <div>
      <h1 className="h1">Reviews</h1>
      <Tabs value={scope} onChange={setScope} options={[{ value: 'mine', label: 'Mis reseñas' }, { value: 'friends', label: 'De amigos' }]} />
      <Async query={q} empty={scope === 'mine' ? 'Aún no has escrito reseñas.' : 'Tus amigos todavía no han escrito reseñas.'}>
        {(list) => <div className="space-y-2">{list.map((r) => <ReviewCard key={r.attendance.id} r={r} />)}</div>}
      </Async>
    </div>
  )
}
