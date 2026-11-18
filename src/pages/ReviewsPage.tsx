import { useState } from 'react'
import { ReviewCard, ReviewGrid } from '@/components/gig'
import { Async, SectionHeader, Tabs } from '@/components/ui'
import { useReviews } from '@/data/hooks'

export default function ReviewsPage() {
  const [scope, setScope] = useState<'mine' | 'friends'>('mine')
  const q = useReviews(scope)
  return (
    <div>
      <SectionHeader as="h1" eyebrow="The words as read from your friends" title="Reviews" />
      <Tabs value={scope} onChange={setScope} options={[{ value: 'mine', label: 'Mis reseñas' }, { value: 'friends', label: 'De amigos' }]} />
      <Async query={q} empty={scope === 'mine' ? 'Aún no has escrito reseñas.' : 'Tus amigos todavía no han escrito reseñas.'}>
        {(list) => <ReviewGrid>{list.map((r) => <ReviewCard key={r.attendance.id} r={r} />)}</ReviewGrid>}
      </Async>
    </div>
  )
}
