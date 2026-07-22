import { type Availability } from '@shared/types/availability'

import { type StaffMember } from '../../types'

export interface Props {
  availability: Availability
  isHoofdAdmin: boolean
  isSelf: boolean
  linkedTypesCount: number
  member: StaffMember
  onEdit: () => void
  onRemove: () => void
  onSchedule: () => void
  onToggleActive: () => void
}
