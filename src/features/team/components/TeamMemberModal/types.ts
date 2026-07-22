import { type StaffMember, type StaffMemberFormData } from '../../types'

export interface Props {
  isHoofdAdmin: boolean
  isSelf: boolean
  onClose: () => void
  onSave: (data: StaffMemberFormData) => void
  member?: StaffMember
}
