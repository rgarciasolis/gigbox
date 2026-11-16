import type { Activity, Attendance, Gigslist, Tag, User } from '@/domain/types'
import type {
  AgendaItem, AgendaQuery, FriendAttendanceView, GigDetail, GigView, ImportCandidate, ProfileView, ReviewView, UpcomingSaved,
} from '@/domain/views'
import type {
  AgendaProvider, AttendanceRepository, AttendanceUpsert, FriendRepository, GigRepository,
  GigslistRepository, ImportService, ProfileRepository, Repositories, TagRepository,
} from '../repositories'
import { getDb, persist, uuid } from './db'
import { activityView, addActivity, attendanceView, followingIds, gigView, haversineKm, me } from './helpers'
import { MockError, simRead, simWrite } from './sim'

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const gigs: GigRepository = {
  async list(filter = {}) {
    const db = await getDb()
    return simRead(() => {
      const now = Date.now()
      const mineIds = new Set(db.attendances.filter((a) => a.userId === db.meta.currentUserId).map((a) => a.gigId))
      const tagged = filter.tagId
        ? new Set(db.attendances.filter((a) => a.userId === db.meta.currentUserId && a.tagIds.includes(filter.tagId!)).map((a) => a.gigId))
        : null
      let list = db.gigs.filter((g) => {
        const t = Date.parse(g.date)
        if (filter.scope === 'past' && t >= now) return false
        if (filter.scope === 'upcoming' && t < now) return false
        if (filter.from && g.date.slice(0, 10) < filter.from) return false
        if (filter.to && g.date.slice(0, 10) > filter.to) return false
        if (filter.onlyMine && !mineIds.has(g.id)) return false
        if (tagged && !tagged.has(g.id)) return false
        if (filter.artistId && !g.artistIds.includes(filter.artistId)) return false
        if (filter.venueId && g.venueId !== filter.venueId) return false
        const v = db.venues.find((x) => x.id === g.venueId)!
        if (filter.city && v.city !== filter.city) return false
        const arts = g.artistIds.map((id) => db.artists.find((a) => a.id === id)!)
        if (filter.genre && !arts.some((a) => a.genre === filter.genre)) return false
        if (filter.q) {
          const q = norm(filter.q)
          if (![g.title, v.name, v.city, ...arts.map((a) => a.name)].some((s) => norm(s).includes(q))) return false
        }
        return true
      })
      list = list.sort((a, b) => a.date.localeCompare(b.date))
      if ((filter.sort ?? (filter.scope === 'upcoming' ? 'date-asc' : 'date-desc')) === 'date-desc') list.reverse()
      let views = list.map((g) => gigView(db, g))
      if (filter.minRating !== undefined) views = views.filter((v) => (v.avgRating ?? 0) >= filter.minRating!)
      return views.slice(0, 200)
    }, [])
  },
  async get(gigId): Promise<GigDetail> {
    const db = await getDb()
    return simRead(() => {
      const gig = db.gigs.find((g) => g.id === gigId)
      if (!gig) throw new MockError('Concierto no encontrado.')
      const view = gigView(db, gig)
      const fol = followingIds(db)
      const atts = db.attendances.filter((a) => a.gigId === gigId)
      const userOf = (id: string) => db.users.find((u) => u.id === id)!
      const reviews: ReviewView[] = atts
        .filter((a) => a.review)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((a) => ({ attendance: a, user: userOf(a.userId), gig: view }))
      return {
        ...view,
        friendsAttended: atts.filter((a) => a.status === 'attended' && fol.has(a.userId)).map((a) => userOf(a.userId)),
        friendsGoing: atts.filter((a) => a.status === 'going' && fol.has(a.userId)).map((a) => userOf(a.userId)),
        attendeeCount: atts.filter((a) => a.status === 'attended').length,
        reviews,
        inGigslistIds: db.gigslists.filter((l) => l.userId === db.meta.currentUserId && l.items.some((i) => i.gigId === gigId)).map((l) => l.id),
      }
    })
  },
  async filterOptions() {
    const db = await getDb()
    return simRead(() => ({
      cities: [...new Set(db.venues.map((v) => v.city))].sort((a, b) => a.localeCompare(b)),
      genres: [...new Set(db.artists.map((a) => a.genre))].sort((a, b) => a.localeCompare(b)),
      artists: db.artists.map((a) => ({ id: a.id, name: a.name })).sort((a, b) => a.name.localeCompare(b.name)),
      venues: db.venues.map((v) => ({ id: v.id, name: v.name, city: v.city })).sort((a, b) => a.name.localeCompare(b.name)),
    }), { cities: [], genres: [], artists: [], venues: [] })
  },
}

const attendances: AttendanceRepository = {
  async listMine(opts = {}) {
    const db = await getDb()
    return simRead(() =>
      db.attendances
        .filter((a) => a.userId === db.meta.currentUserId && (!opts.tagId || a.tagIds.includes(opts.tagId)) && (!opts.status || a.status === opts.status))
        .map((a) => attendanceView(db, a))
        .sort((a, b) => b.gig.gig.date.localeCompare(a.gig.gig.date)), [])
  },
  async upsert(input: AttendanceUpsert) {
    const db = await getDb()
    return simWrite(() => {
      const gig = db.gigs.find((g) => g.id === input.gigId)
      if (!gig) throw new MockError('Concierto no encontrado.')
      const uid = db.meta.currentUserId
      let a = db.attendances.find((x) => x.userId === uid && x.gigId === input.gigId)
      const isNew = !a
      const upcoming = Date.parse(gig.date) >= Date.now()
      if (!a) {
        a = { id: uuid(), userId: uid, gigId: input.gigId, status: input.status ?? (upcoming ? 'going' : 'attended'), rating: null, review: null, tagIds: [], createdAt: new Date().toISOString() }
        db.attendances.push(a)
      }
      if (input.status) a.status = input.status
      if (input.rating !== undefined) {
        if (input.rating !== null && (input.rating < 0.5 || input.rating > 5 || (input.rating * 2) % 1 !== 0)) throw new MockError('La nota va de 0,5 a 5 en pasos de 0,5.')
        a.rating = input.rating
      }
      if (input.review !== undefined) a.review = input.review?.trim() ? input.review.trim() : null
      if (input.tagIds) a.tagIds = input.tagIds
      const act = (type: Activity['type'], rating: number | null = null) =>
        addActivity(db, { userId: uid, type, gigId: gig.id, targetUserId: null, rating }, uuid)
      if (isNew) act(a.status === 'going' ? 'going' : 'attended')
      if (input.rating) act('rated', input.rating)
      if (input.review) act('reviewed')
      persist(db)
      return a as Attendance
    })
  },
  async remove(gigId) {
    const db = await getDb()
    return simWrite(() => {
      db.attendances = db.attendances.filter((a) => !(a.userId === db.meta.currentUserId && a.gigId === gigId))
      persist(db)
    })
  },
  async reviews(scope, limit = 100) {
    const db = await getDb()
    return simRead(() => {
      const fol = followingIds(db)
      return db.attendances
        .filter((a) => a.review && (scope === 'mine' ? a.userId === db.meta.currentUserId : fol.has(a.userId)))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit)
        .map((a): ReviewView => ({ attendance: a, user: db.users.find((u) => u.id === a.userId)!, gig: gigView(db, db.gigs.find((g) => g.id === a.gigId)!) }))
    }, [])
  },
}

const gigslists: GigslistRepository = {
  async listMine() {
    const db = await getDb()
    return simRead(() => db.gigslists.filter((l) => l.userId === db.meta.currentUserId), [] as Gigslist[])
  },
  async upcomingSaved() {
    const db = await getDb()
    return simRead(() => {
      const map = new Map<string, UpcomingSaved>()
      for (const l of db.gigslists.filter((x) => x.userId === db.meta.currentUserId))
        for (const it of l.items) {
          const g = db.gigs.find((x) => x.id === it.gigId)
          if (!g || Date.parse(g.date) < Date.now()) continue
          const e = map.get(g.id) ?? { gig: gigView(db, g), gigslistNames: [] }
          e.gigslistNames.push(l.name)
          map.set(g.id, e)
        }
      return [...map.values()].sort((a, b) => a.gig.gig.date.localeCompare(b.gig.gig.date))
    }, [])
  },
  async listWithItems() {
    const db = await getDb()
    return simRead(() =>
      db.gigslists.filter((l) => l.userId === db.meta.currentUserId).map((l) => ({
        gigslist: l,
        items: l.items
          .map((it) => ({ gig: gigView(db, db.gigs.find((g) => g.id === it.gigId)!), addedAt: it.addedAt }))
          .sort((a, b) => a.gig.gig.date.localeCompare(b.gig.gig.date)),
      })), [])
  },
  async add(gigslistId, gigId) {
    const db = await getDb()
    return simWrite(() => {
      const l = db.gigslists.find((x) => x.id === gigslistId && x.userId === db.meta.currentUserId)
      if (!l) throw new MockError('Gigslist no encontrada.')
      if (!l.items.some((i) => i.gigId === gigId)) {
        l.items.push({ gigId, addedAt: new Date().toISOString() })
        addActivity(db, { userId: l.userId, type: 'saved', gigId, targetUserId: null, rating: null }, uuid)
      }
      persist(db)
    })
  },
  async remove(gigslistId, gigId) {
    const db = await getDb()
    return simWrite(() => {
      const l = db.gigslists.find((x) => x.id === gigslistId)
      if (l) l.items = l.items.filter((i) => i.gigId !== gigId)
      persist(db)
    })
  },
  async create(name) {
    const db = await getDb()
    return simWrite(() => {
      if (!name.trim()) throw new MockError('El nombre no puede estar vacío.')
      const l: Gigslist = { id: uuid(), userId: db.meta.currentUserId, name: name.trim(), isDefault: false, items: [] }
      db.gigslists.push(l)
      persist(db)
      return l
    })
  },
}

const profiles: ProfileRepository = {
  async getCurrent() {
    const db = await getDb()
    return simRead(() => me(db))
  },
  async getProfile(userId): Promise<ProfileView> {
    const db = await getDb()
    return simRead(() => {
      const user = db.users.find((u) => u.id === userId)
      if (!user) throw new MockError('Usuario no encontrado.')
      const atts = db.attendances.filter((a) => a.userId === userId && a.status === 'attended')
      const gigsOf = atts.map((a) => db.gigs.find((g) => g.id === a.gigId)!)
      const venues = new Set(gigsOf.map((g) => g.venueId))
      const cities = new Set([...venues].map((v) => db.venues.find((x) => x.id === v)!.city))
      const artistSet = new Set(gigsOf.flatMap((g) => g.artistIds))
      const myGigIds = new Set(db.attendances.filter((a) => a.userId === db.meta.currentUserId).map((a) => a.gigId))
      const byLoggedDateDesc = (a: Attendance, b: Attendance) => b.createdAt.localeCompare(a.createdAt)
      return {
        user,
        stats: { gigs: atts.length, artists: artistSet.size, venues: venues.size, cities: cities.size },
        favorites: atts.filter((a) => (a.rating ?? 0) >= 4.5).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 5).map((a) => attendanceView(db, a)),
        recentGigs: [...atts].sort(byLoggedDateDesc).slice(0, 5).map((a) => attendanceView(db, a)),
        recentReviews: db.attendances
          .filter((a) => a.userId === userId && a.review)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 5)
          .map((a): ReviewView => ({ attendance: a, user, gig: gigView(db, db.gigs.find((g) => g.id === a.gigId)!) })),
        followers: db.follows.filter((f) => f.followeeId === userId).length,
        following: db.follows.filter((f) => f.followerId === userId).length,
        isMe: userId === db.meta.currentUserId,
        isFollowing: followingIds(db).has(userId),
        sharedGigs: userId === db.meta.currentUserId ? 0 : db.attendances.filter((a) => a.userId === userId && myGigIds.has(a.gigId)).length,
      }
    })
  },
  async setPlus(plus) {
    const db = await getDb()
    return simWrite(() => {
      const u = me(db)
      u.plus = plus
      persist(db)
      return { ...u } as User
    })
  },
}

const friends: FriendRepository = {
  async following() {
    const db = await getDb()
    return simRead(() => {
      const ids = followingIds(db)
      return db.users.filter((u) => ids.has(u.id))
    }, [] as User[])
  },
  async suggestions() {
    const db = await getDb()
    return simRead(() => {
      const ids = followingIds(db)
      return db.users.filter((u) => u.id !== db.meta.currentUserId && !ids.has(u.id)).slice(0, 12)
    }, [] as User[])
  },
  async follow(userId) {
    const db = await getDb()
    return simWrite(() => {
      if (!db.follows.some((f) => f.followerId === db.meta.currentUserId && f.followeeId === userId)) {
        db.follows.push({ followerId: db.meta.currentUserId, followeeId: userId, createdAt: new Date().toISOString() })
        addActivity(db, { userId: db.meta.currentUserId, type: 'followed', gigId: null, targetUserId: userId, rating: null }, uuid)
      }
      persist(db)
    })
  },
  async unfollow(userId) {
    const db = await getDb()
    return simWrite(() => {
      db.follows = db.follows.filter((f) => !(f.followerId === db.meta.currentUserId && f.followeeId === userId))
      persist(db)
    })
  },
  async feed() {
    const db = await getDb()
    return simRead(() => {
      const ids = followingIds(db)
      return db.activities
        .filter((a) => ids.has(a.userId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 60)
        .map((a) => activityView(db, a.id)!)
    }, [])
  },
  async recentConcerts(limit = 5) {
    const db = await getDb()
    return simRead(() => {
      const fol = followingIds(db)
      return db.attendances
        .filter((a) => a.status === 'attended' && fol.has(a.userId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit)
        .map((a): FriendAttendanceView => ({
          user: db.users.find((u) => u.id === a.userId)!,
          attendance: a,
          gig: gigView(db, db.gigs.find((g) => g.id === a.gigId)!),
        }))
    }, [] as FriendAttendanceView[])
  },
}

const tags: TagRepository = {
  async listMine() {
    const db = await getDb()
    return simRead(() =>
      db.tags.filter((t) => t.userId === db.meta.currentUserId).map((tag) => ({
        tag,
        count: db.attendances.filter((a) => a.userId === db.meta.currentUserId && a.tagIds.includes(tag.id)).length,
      })), [])
  },
  async create(name) {
    const db = await getDb()
    return simWrite(() => {
      const n = name.trim()
      if (!n) throw new MockError('El tag no puede estar vacío.')
      const ex = db.tags.find((t) => t.userId === db.meta.currentUserId && t.name.toLowerCase() === n.toLowerCase())
      if (ex) return ex as Tag
      const t: Tag = { id: uuid(), userId: db.meta.currentUserId, name: n }
      db.tags.push(t)
      persist(db)
      return t
    })
  },
  async remove(tagId) {
    const db = await getDb()
    return simWrite(() => {
      db.tags = db.tags.filter((t) => t.id !== tagId)
      for (const a of db.attendances) a.tagIds = a.tagIds.filter((i) => i !== tagId)
      persist(db)
    })
  },
}

const agenda: AgendaProvider = {
  async upcoming(q: AgendaQuery) {
    const db = await getDb()
    return simRead(() => {
      const user = me(db)
      const myArtists = new Set(
        db.attendances.filter((a) => a.userId === user.id && a.status === 'attended').flatMap((a) => db.gigs.find((g) => g.id === a.gigId)!.artistIds),
      )
      const home = db.venues.find((v) => v.city === user.city)
      const from = q.from ? Date.parse(q.from) : Date.now()
      const to = q.to ? Date.parse(q.to) + 86400000 : Infinity
      const out: AgendaItem[] = []
      for (const g of db.gigs) {
        const t = Date.parse(g.date)
        if (t < from || t > to) continue
        const v = db.venues.find((x) => x.id === g.venueId)!
        const arts = g.artistIds.map((id) => db.artists.find((a) => a.id === id)!)
        if (q.genre && !arts.some((a) => a.genre === q.genre)) continue
        const matched = arts.filter((a) => myArtists.has(a.id)).map((a) => a.name)
        const distance = home ? Math.round(haversineKm(home.lat, home.lon, v.lat, v.lon)) : null
        const inCity = v.city === user.city
        const inRadius = q.radiusKm === null ? inCity : distance !== null && distance <= q.radiusKm
        const byArtist = matched.length > 0
        if (!inRadius) continue
        if (q.onlyMyArtists ? !byArtist : !(byArtist || inCity)) continue
        out.push({ gig: gigView(db, g), reason: byArtist && inCity ? 'both' : byArtist ? 'artist' : 'city', distanceKm: distance, matchedArtists: matched })
      }
      return out.sort((a, b) => a.gig.gig.date.localeCompare(b.gig.gig.date))
    }, [])
  },
}

const imports: ImportService = {
  async sampleEmail() {
    const db = await getDb()
    return simRead(() => {
      const uid = db.meta.currentUserId
      const seen = new Set(db.attendances.filter((a) => a.userId === uid).map((a) => a.gigId))
      const past = db.gigs.filter((g) => Date.parse(g.date) < Date.now())
      const dup = past.find((g) => seen.has(g.id))!
      const fresh = past.filter((g) => !seen.has(g.id)).slice(-2)
      const line = (g: typeof dup) => {
        const a = db.artists.find((x) => x.id === g.artistIds[0])!
        const v = db.venues.find((x) => x.id === g.venueId)!
        return `Entrada: ${a.name} - ${v.name} (${v.city}) - ${g.date.slice(0, 10)} - Fila ${Math.floor(Math.random() * 20) + 1}`
      }
      return `Asunto: Tus entradas (pedido #A-48213)\n\nGracias por tu compra. Resumen:\n\n${[dup, ...fresh].map(line).join('\n')}\n\nEste es un correo de ejemplo generado para la demo.`
    }, '')
  },
  async parseEmail(rawText) {
    const db = await getDb()
    return simRead(() => {
      if (!rawText.trim()) throw new MockError('Pega o sube un email para analizar.')
      const uid = db.meta.currentUserId
      const mine = new Set(db.attendances.filter((a) => a.userId === uid).map((a) => a.gigId))
      const text = norm(rawText)
      const cands: ImportCandidate[] = []
      for (const art of db.artists) {
        if (!text.includes(norm(art.name))) continue
        const idx = text.indexOf(norm(art.name))
        const lineStart = rawText.lastIndexOf('\n', idx) + 1
        const snippet = rawText.slice(lineStart, idx + 120).split('\n')[0].trim()
        // fecha explicita cercana, si existe
        const m = rawText.slice(idx, idx + 140).match(/\d{4}-\d{2}-\d{2}/)
        const pool = db.gigs.filter((g) => g.artistIds[0] === art.id && Date.parse(g.date) < Date.now())
        const gig = (m && pool.find((g) => g.date.startsWith(m[0]))) || pool[pool.length - 1]
        if (!gig) continue
        const v = db.venues.find((x) => x.id === gig.venueId)!
        const dup = db.attendances.find((a) => a.userId === uid && a.gigId === gig.id)
        cands.push({ id: uuid(), snippet, artistName: art.name, venueName: v.name, date: gig.date.slice(0, 10), matchedGigId: gig.id, duplicateOfAttendanceId: dup?.id ?? null, confidence: m ? 0.93 : 0.7 })
        if (cands.length >= 8) break
      }
      void mine
      return { candidates: cands }
    }, { candidates: [] })
  },
  async confirm({ candidates }) {
    const db = await getDb()
    return simWrite(() => {
      let created = 0, skipped = 0
      for (const c of candidates) {
        const gig = c.matchedGigId ? db.gigs.find((g) => g.id === c.matchedGigId) : undefined
        const exists = gig && db.attendances.some((a) => a.userId === db.meta.currentUserId && a.gigId === gig.id)
        if (!gig || exists) { skipped++; continue }
        db.attendances.push({ id: uuid(), userId: db.meta.currentUserId, gigId: gig.id, status: 'attended', rating: null, review: null, tagIds: [], createdAt: new Date().toISOString() })
        addActivity(db, { userId: db.meta.currentUserId, type: 'attended', gigId: gig.id, targetUserId: null, rating: null }, uuid)
        created++
      }
      persist(db)
      return { created, skipped }
    })
  },
}

export function createMockRepositories(): Repositories {
  return { gigs, attendances, gigslists, profiles, friends, tags, agenda, imports }
}
export type { GigView, UpcomingSaved }
