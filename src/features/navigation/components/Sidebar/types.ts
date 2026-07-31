import { type IdentityStatus } from '@features/identity/types'
import { type PreparationState } from '@features/preparation/types'

export interface Props {
  allowedPaths: string[] | null
  email: string
  firstName: string | null
  identityStatus?: IdentityStatus
  isMedewerker?: boolean
  lastName: string | null
  photo: string | null
  preparation?: PreparationState
}
