import { Link } from 'react-router-dom'
import { Async, Avatar } from '@/components/ui'
import { useFriendsRecentConcerts, useReviews } from '@/data/hooks'
import type { FriendAttendanceView, ReviewView } from '@/domain/views'
import { fmtDate, fmtRating, stars } from '@/lib'

function HotCard({ v }: { v: FriendAttendanceView }) {
  const { gig, artists, venue } = v.gig
  return (
    <Link to={`/gigs/${gig.id}`} className="flex flex-col overflow-hidden bg-green-50 text-center transition hover:bg-green-100">
      <p className="pt-3 text-xs text-zinc-800">{fmtDate(gig.date)}</p>
      <div className="px-3 py-2">
        <h3 className="font-heading text-2xl font-bold leading-tight">{artists[0]?.name ?? gig.title}</h3>
        {artists.length > 1 && <p className="truncate font-heading text-lg font-medium leading-tight">{artists.slice(1).map((a) => a.name).join(', ')}</p>}
      </div>
      <p className="mt-auto flex items-center gap-1.5 px-3 pb-3 text-sm text-zinc-700">
        <Avatar user={v.user} size={18} /> {v.user.displayName}
      </p>
      <p className="truncate bg-green-950 px-2 py-1 text-xs uppercase tracking-wide text-white">{venue.name}, {venue.city}</p>
    </Link>
  )
}

function Review({ r }: { r: ReviewView }) {
  return (
    <article>
      <p className="flex items-center gap-2 text-sm text-zinc-700"><Avatar user={r.user} size={18} /> {r.user.displayName}</p>
      <h3 className="mt-3 font-heading text-xl font-bold text-zinc-700">
        <Link to={`/gigs/${r.gig.gig.id}`} className="hover:underline">{r.gig.gig.title}</Link>
      </h3>
      <p className="text-xs text-zinc-500">{fmtDate(r.attendance.createdAt)} · {r.gig.venue.name}, {r.gig.venue.city}</p>
      {r.attendance.rating !== null && <p className="text-sm text-green-600" title={`${fmtRating(r.attendance.rating)} / 5`}>{stars(r.attendance.rating)}</p>}
      <p className="mt-3 text-sm leading-relaxed text-zinc-800">{r.attendance.review}</p>
    </article>
  )
}

export default function HomePage() {
  const concerts = useFriendsRecentConcerts(8)
  const reviews = useReviews('friends', 6)
  return (
    <div>
      <section className="relative flex h-[440px] items-end bg-zinc-950 sm:h-[420px]">
        <img src="/images/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 to-transparent" />
        <h1 className="relative mx-auto w-full max-w-6xl px-3 pb-10 font-heading text-3xl font-medium leading-tight text-green-300 sm:text-5xl">
          <span className="block max-w-xl">Log, rate, and share every concert you experience.</span>
        </h1>
      </section>

      <section className="mx-auto max-w-6xl px-3 py-12">
        <p className="eyebrow">The wishlist, chosen by your friends</p>
        <h2 className="section-title">What's Hot Today</h2>
        <Async query={concerts} empty="Tus amigos aún no han logado conciertos. Sigue a más gente desde Perfil → Friends.">
          {(list) => (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{list.map((v) => <HotCard key={v.attendance.id} v={v} />)}</div>
              <div className="mt-6 text-center"><Link to="/gigs" className="btn btn-primary px-8 uppercase">More</Link></div>
            </>
          )}
        </Async>
      </section>

      <section className="mx-auto max-w-6xl px-3 pb-16">
        <p className="eyebrow">The words as read from your friends</p>
        <h2 className="section-title">Popular reviews</h2>
        <Async query={reviews} empty="Tus amigos aún no han escrito reviews.">
          {(list) => <div className="grid gap-x-16 gap-y-10 md:grid-cols-2">{list.map((r) => <Review key={r.attendance.id} r={r} />)}</div>}
        </Async>
      </section>
    </div>
  )
}
