// CONTRATOS de datos. Las pantallas solo dependen de estas interfaces (via hooks).
// Un adaptador "real" (Supabase, etc.) debe implementar exactamente lo mismo.
import type { Attendance, AttendanceStatus, Gigslist, Tag, User, UUID } from '@/domain/types'
import type {
  ActivityView, AgendaItem, AgendaQuery, AttendanceView, FriendAttendanceView, GigDetail, GigFilter, GigFilterOptions,
  GigslistView, GigView, ImportConfirmation, ImportResult, ProfileView, ReviewView, TagWithCount, UpcomingSaved,
} from '@/domain/views'

export interface GigRepository {
  list(filter?: GigFilter): Promise<GigView[]>
  get(gigId: UUID): Promise<GigDetail>
  filterOptions(): Promise<GigFilterOptions>
}

export interface AttendanceUpsert {
  gigId: UUID
  status?: AttendanceStatus
  rating?: number | null
  review?: string | null
  tagIds?: UUID[]
}

export interface AttendanceRepository {
  /** Mis asistencias (opcionalmente filtradas por tag y/o estado). */
  listMine(opts?: { tagId?: UUID; status?: AttendanceStatus }): Promise<AttendanceView[]>
  /** Crea o actualiza mi asistencia a un gig. */
  upsert(input: AttendanceUpsert): Promise<Attendance>
  remove(gigId: UUID): Promise<void>
  reviews(scope: 'mine' | 'friends', limit?: number): Promise<ReviewView[]>
}

export interface GigslistRepository {
  listMine(): Promise<Gigslist[]>
  /** Conciertos futuros guardados en cualquiera de mis gigslists, por fecha. */
  upcomingSaved(): Promise<UpcomingSaved[]>
  listWithItems(): Promise<GigslistView[]>
  add(gigslistId: UUID, gigId: UUID): Promise<void>
  remove(gigslistId: UUID, gigId: UUID): Promise<void>
  create(name: string): Promise<Gigslist>
}

export interface ProfileRepository {
  getCurrent(): Promise<User>
  getProfile(userId: UUID): Promise<ProfileView>
  /** Suscripcion simulada: activa/desactiva Plus. */
  setPlus(plus: boolean): Promise<User>
}

export interface FriendRepository {
  following(): Promise<User[]>
  suggestions(): Promise<User[]>
  follow(userId: UUID): Promise<void>
  unfollow(userId: UUID): Promise<void>
  feed(): Promise<ActivityView[]>
  /** Ultimos conciertos logados por la gente que sigo (para Home). */
  recentConcerts(limit?: number): Promise<FriendAttendanceView[]>
}

export interface TagRepository {
  listMine(): Promise<TagWithCount[]>
  create(name: string): Promise<Tag>
  remove(tagId: UUID): Promise<void>
}

export interface AgendaProvider {
  upcoming(query: AgendaQuery): Promise<AgendaItem[]>
}

export interface ImportService {
  /** Texto de ejemplo para probar el flujo. */
  sampleEmail(): Promise<string>
  /** "Detecta" conciertos en un email (en el mock, resultado dummy). */
  parseEmail(rawText: string): Promise<ImportResult>
  /** Confirma los candidatos revisados y crea las asistencias. */
  confirm(input: ImportConfirmation): Promise<{ created: number; skipped: number }>
}

export interface Repositories {
  gigs: GigRepository
  attendances: AttendanceRepository
  gigslists: GigslistRepository
  profiles: ProfileRepository
  friends: FriendRepository
  tags: TagRepository
  agenda: AgendaProvider
  imports: ImportService
}
