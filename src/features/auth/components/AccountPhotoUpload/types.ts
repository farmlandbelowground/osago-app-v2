import { type ProfileRole } from '@shared/auth/types'

export interface Props {
  createdAt: string
  email: string
  firstName: string | null
  lastName: string | null
  photo: string | null
  role: ProfileRole
}
