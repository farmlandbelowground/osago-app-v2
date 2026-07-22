import { type AdminRole } from '@shared/auth/types'

export interface Props {
  email: string
  firstName: string | null
  lastName: string | null
  photo: string | null
  role: AdminRole
}
