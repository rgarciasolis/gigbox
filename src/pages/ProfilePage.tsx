import { useParams } from 'react-router-dom'
import { ProfileHeader, ProfileOverview } from '@/components/profile'
import { Async } from '@/components/ui'
import { useProfile } from '@/data/hooks'

/** Perfil de otro usuario (/u/:userId). Mi perfil vive en /perfil (ProfileLayout). */
export default function ProfilePage() {
  const { userId = '' } = useParams()
  const profile = useProfile(userId)
  return (
    <Async query={profile}>
      {(p) => (
        <div className="space-y-10">
          <ProfileHeader p={p} />
          <ProfileOverview p={p} />
        </div>
      )}
    </Async>
  )
}
