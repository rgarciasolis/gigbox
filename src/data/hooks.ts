// Hooks de TanStack Query sobre los repositorios. Las pantallas usan SOLO esto.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isFlagEnabled, type FeatureFlag } from '@/config/flags'
import type { AgendaQuery, GigFilter, ImportConfirmation } from '@/domain/views'
import type { UUID } from '@/domain/types'
import { repos } from '.'
import type { AttendanceUpsert } from './repositories'

export const qk = {
  me: ['me'] as const,
  gigs: (f?: GigFilter) => ['gigs', f ?? {}] as const,
  gig: (id: string) => ['gig', id] as const,
  filterOptions: ['filterOptions'] as const,
  myAttendances: (tagId?: string) => ['attendances', 'mine', tagId ?? null] as const,
  reviews: (s: string) => ['reviews', s] as const,
  gigslists: ['gigslists'] as const,
  upcomingSaved: ['upcomingSaved'] as const,
  profile: (id: string) => ['profile', id] as const,
  following: ['following'] as const,
  suggestions: ['suggestions'] as const,
  feed: ['feed'] as const,
  tags: ['tags'] as const,
  agenda: (q: AgendaQuery) => ['agenda', q] as const,
}

export const useMe = () => useQuery({ queryKey: qk.me, queryFn: () => repos.profiles.getCurrent() })
export const useFlag = (flag: FeatureFlag) => {
  const { data, isLoading } = useMe()
  return { enabled: isFlagEnabled(flag, data), isLoading }
}

export const useGigs = (f?: GigFilter) => useQuery({ queryKey: qk.gigs(f), queryFn: () => repos.gigs.list(f) })
export const useGig = (id: string) => useQuery({ queryKey: qk.gig(id), queryFn: () => repos.gigs.get(id) })
export const useGigFilterOptions = () => useQuery({ queryKey: qk.filterOptions, queryFn: () => repos.gigs.filterOptions() })
export const useMyAttendances = (tagId?: UUID) =>
  useQuery({ queryKey: qk.myAttendances(tagId), queryFn: () => repos.attendances.listMine({ tagId }) })
export const useReviews = (scope: 'mine' | 'friends') =>
  useQuery({ queryKey: qk.reviews(scope), queryFn: () => repos.attendances.reviews(scope) })
export const useGigslists = () => useQuery({ queryKey: qk.gigslists, queryFn: () => repos.gigslists.listWithItems() })
export const useUpcomingSaved = () => useQuery({ queryKey: qk.upcomingSaved, queryFn: () => repos.gigslists.upcomingSaved() })
export const useProfile = (id: UUID | undefined) =>
  useQuery({ queryKey: qk.profile(id ?? ''), queryFn: () => repos.profiles.getProfile(id!), enabled: !!id })
export const useFollowing = () => useQuery({ queryKey: qk.following, queryFn: () => repos.friends.following() })
export const useSuggestions = () => useQuery({ queryKey: qk.suggestions, queryFn: () => repos.friends.suggestions() })
export const useFeed = () => useQuery({ queryKey: qk.feed, queryFn: () => repos.friends.feed() })
export const useTags = () => useQuery({ queryKey: qk.tags, queryFn: () => repos.tags.listMine() })
export const useAgenda = (q: AgendaQuery, enabled: boolean) =>
  useQuery({ queryKey: qk.agenda(q), queryFn: () => repos.agenda.upcoming(q), enabled })

/** Mutaciones: invalidan todo (simple y correcto para un MVP). */
function useMut<A, R>(fn: (a: A) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries() })
}
export const useUpsertAttendance = () => useMut((i: AttendanceUpsert) => repos.attendances.upsert(i))
export const useRemoveAttendance = () => useMut((gigId: UUID) => repos.attendances.remove(gigId))
export const useAddToGigslist = () => useMut((a: { gigslistId: UUID; gigId: UUID }) => repos.gigslists.add(a.gigslistId, a.gigId))
export const useRemoveFromGigslist = () => useMut((a: { gigslistId: UUID; gigId: UUID }) => repos.gigslists.remove(a.gigslistId, a.gigId))
export const useCreateGigslist = () => useMut((name: string) => repos.gigslists.create(name))
export const useFollow = () => useMut((id: UUID) => repos.friends.follow(id))
export const useUnfollow = () => useMut((id: UUID) => repos.friends.unfollow(id))
export const useCreateTag = () => useMut((name: string) => repos.tags.create(name))
export const useRemoveTag = () => useMut((id: UUID) => repos.tags.remove(id))
export const useSetPlus = () => useMut((plus: boolean) => repos.profiles.setPlus(plus))
export const useParseEmail = () => useMutation({ mutationFn: (t: string) => repos.imports.parseEmail(t) })
export const useSampleEmail = () => useMutation({ mutationFn: () => repos.imports.sampleEmail() })
export const useConfirmImport = () => useMut((i: ImportConfirmation) => repos.imports.confirm(i))
