import type { TagRepository } from '@/domain/repositories'
import { ME_ID, newId, persist, state } from './db'
import { call } from './latency'
import { norm } from './selectors'

function mine(id: string) {
  const t = state.tags.find((x) => x.id === id && x.userId === ME_ID)
  if (!t) throw new Error('Tag no encontrado')
  return t
}

function assertUnique(name: string, exceptId?: string) {
  if (state.tags.some((t) => t.userId === ME_ID && t.id !== exceptId && norm(t.name) === norm(name)))
    throw new Error('Ya tienes un tag con ese nombre')
}

export const tagRepository: TagRepository = {
  list: () =>
    call(() =>
      state.tags
        .filter((t) => t.userId === ME_ID)
        .map((t) => ({
          ...t,
          count: state.attendances.filter((a) => a.userId === ME_ID && a.tagIds.includes(t.id)).length,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'es')),
    ),

  create: (name) =>
    call(() => {
      const n = name.trim()
      if (!n) throw new Error('El tag necesita un nombre')
      assertUnique(n)
      const tag = { id: newId(), userId: ME_ID, name: n }
      state.tags.push(tag)
      persist()
      return tag
    }),

  rename: (id, name) =>
    call(() => {
      const t = mine(id)
      const n = name.trim()
      if (!n) throw new Error('El tag necesita un nombre')
      assertUnique(n, id)
      t.name = n
      persist()
      return t
    }),

  remove: (id) =>
    call(() => {
      mine(id)
      state.tags = state.tags.filter((t) => t.id !== id)
      for (const a of state.attendances) a.tagIds = a.tagIds.filter((x) => x !== id)
      persist()
    }),
}
