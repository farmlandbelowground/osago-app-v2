import { type AdminResetAction, type AdminResetType } from '../../types'

export interface Props {
  label: string
  resetAction: AdminResetAction
  resetType: AdminResetType
}
