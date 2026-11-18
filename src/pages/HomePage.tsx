import { Link } from 'react-router-dom'
import { GigCard, GigGrid, ReviewCard, ReviewGrid } from '@/components/gig'
import { Async, SectionHeader } from '@/components/ui'
import { useFriendsRecentConcerts, useReviews } from '@/data/hooks'
import type { ReviewView } from '@/domain/views'

function Review({ r }: { r: ReviewView }) {
  return <ReviewCard r={r} />
}

export default function HomePage() {
  const concerts = useFriendsRecentConcerts(8)
  const reviews = useReviews('friends', 6)
  return (
    <div>
      <section className="relative flex h-[440px] items-end bg-zinc-950 lg:h-[592px]">
        <img src="/images/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 to-transparent" />
        <h1 className="relative mx-auto w-full max-w-page px-5 pb-10 font-heading text-4xl font-bold leading-[1.2] text-green-300 lg:px-[141px] lg:pb-[51px] lg:text-5xl">
          <span className="block max-w-[732px]">Log, rate, and share every concert you experience.</span>
        </h1>
      </section>

      <section className="mx-auto max-w-page px-5 py-14">
        <SectionHeader eyebrow="The wishlist, chosen by your friends" title="What's Hot Today" />
        <Async query={concerts} empty="Tus amigos aún no han logado conciertos. Sigue a más gente desde Perfil → Friends.">
          {(list) => (
            <>
              <GigGrid>{list.map((v) => <GigCard key={v.attendance.id} view={v.gig} who={v.user} />)}</GigGrid>
              <div className="mt-6 text-center"><Link to="/gigs" className="btn btn-primary px-8 py-3.5 text-sm">More</Link></div>
            </>
          )}
        </Async>
      </section>

      <section className="mx-auto max-w-page px-5 pb-16">
        <SectionHeader eyebrow="The words as read from your friends" title="Popular reviews" />
        <Async query={reviews} empty="Tus amigos aún no han escrito reviews.">
          {(list) => <ReviewGrid>{list.map((r) => <Review key={r.attendance.id} r={r} />)}</ReviewGrid>}
        </Async>
      </section>
    </div>
  )
}
