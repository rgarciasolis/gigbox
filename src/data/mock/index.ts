import type { Repositories } from '@/domain/repositories'
import { agendaProvider } from './agenda'
import { artistFollowRepository } from './artistFollows'
import { attendanceRepository } from './attendances'
import { feedRepository } from './feed'
import { friendRepository } from './friends'
import { gigRepository } from './gigs'
import { gigslistRepository } from './gigslists'
import { notificationRepository } from './notifications'
import { profileRepository } from './profiles'
import { tagRepository } from './tags'

export function createMockRepositories(): Repositories {
  return {
    gigs: gigRepository,
    attendances: attendanceRepository,
    gigslists: gigslistRepository,
    profiles: profileRepository,
    friends: friendRepository,
    tags: tagRepository,
    agenda: agendaProvider,
    artistFollows: artistFollowRepository,
    notifications: notificationRepository,
    feed: feedRepository,
  }
}
