import type { GigslistRepository } from '@/domain/repositories'
import type { Gigslist, ListDetail, WishlistEntry } from '@/domain/types'
import { getMockConfig } from './config'
import { ME_ID, gigById, newId, nowIso, persist, state, userById } from './db'
import { call } from './latency'
import { isPastGig, me, myWishlist, summary } from './selectors'

function entriesOf(list: Gigslist): WishlistEntry[] {
  return list.items
    .map((item) => ({ item, gig: summary(item.gigId) }))
    .sort((a, b) => a.gig.gig.startsAt.localeCompare(b.gig.gig.startsAt))
}

function mineCustom(id: string): Gigslist {
  const l = state.gigslists.find((x) => x.id === id && x.userId === ME_ID && x.kind === 'custom')
  if (!l) throw new Error('Lista no encontrada')
  return l
}

export const gigslistRepository: GigslistRepository = {
  getWishlist: () =>
    call(() => (getMockConfig().empty ? [] : entriesOf(myWishlist()))),

  addToWishlist: (gigId) =>
    call(() => {
      const gig = gigById.get(gigId)
      if (!gig) throw new Error('Concierto no encontrado')
      if (isPastGig(gig)) throw new Error('Voy a ir solo se puede usar en conciertos futuros')
      const wl = myWishlist()
      if (wl.items.some((i) => i.gigId === gigId)) return
      const addedAt = nowIso()
      wl.items.push({ gigId, addedAt, ticketStatus: 'no_ticket' })
      state.activities.push({
        id: newId(), userId: ME_ID, type: 'wishlist_add', gigId, attendanceId: null, createdAt: addedAt,
      })
      persist()
    }),

  removeFromWishlist: (gigId) =>
    call(() => {
      const wl = myWishlist()
      wl.items = wl.items.filter((i) => i.gigId !== gigId)
      state.activities = state.activities.filter(
        (a) => !(a.userId === ME_ID && a.type === 'wishlist_add' && a.gigId === gigId),
      )
      persist()
    }),

  setTicketStatus: (gigId, status) =>
    call(() => {
      const item = myWishlist().items.find((i) => i.gigId === gigId)
      if (!item) throw new Error('El concierto no esta en tu wishlist')
      item.ticketStatus = status
      persist()
    }),

  listLists: () =>
    call(() =>
      getMockConfig().empty
        ? []
        : state.gigslists.filter((l) => l.userId === ME_ID && l.kind === 'custom'),
    ),

  getList: (id) =>
    call((): ListDetail => {
      const list = state.gigslists.find((l) => l.id === id && l.kind === 'custom')
      if (!list) throw new Error('Lista no encontrada')
      const owner = list.userId === ME_ID ? me() : userById.get(list.userId)!
      return { list, entries: entriesOf(list), owner }
    }),

  createList: (input) =>
    call(() => {
      const title = input.title.trim()
      if (!title) throw new Error('La lista necesita un titulo')
      const list: Gigslist = {
        id: newId(), userId: ME_ID, kind: 'custom', title,
        description: input.description?.trim() || null, items: [],
      }
      state.gigslists.push(list)
      persist()
      return list
    }),

  updateList: (id, patch) =>
    call(() => {
      const list = mineCustom(id)
      if (patch.title !== undefined) {
        if (!patch.title.trim()) throw new Error('La lista necesita un titulo')
        list.title = patch.title.trim()
      }
      if (patch.description !== undefined) list.description = patch.description?.trim() || null
      persist()
      return list
    }),

  deleteList: (id) =>
    call(() => {
      mineCustom(id)
      state.gigslists = state.gigslists.filter((l) => l.id !== id)
      persist()
    }),

  addToList: (listId, gigId) =>
    call(() => {
      const list = mineCustom(listId)
      if (!gigById.has(gigId)) throw new Error('Concierto no encontrado')
      if (!list.items.some((i) => i.gigId === gigId))
        list.items.push({ gigId, addedAt: nowIso(), ticketStatus: 'no_ticket' })
      persist()
    }),

  removeFromList: (listId, gigId) =>
    call(() => {
      const list = mineCustom(listId)
      list.items = list.items.filter((i) => i.gigId !== gigId)
      persist()
    }),
}
