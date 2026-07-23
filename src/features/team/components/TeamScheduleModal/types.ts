import { type Availability } from '@shared/types/availability'

export interface Props {
  adminId: string
  availability: Availability | null
  memberName: string
  onClose: () => void
}
