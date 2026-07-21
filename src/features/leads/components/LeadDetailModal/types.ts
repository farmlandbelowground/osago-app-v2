import { type ReactNode } from 'react'

import { type Lead, type LeadSourceVariant } from '../../types'

export interface Props {
  footer: ReactNode
  lead: Lead
  onClose: () => void
  variant: LeadSourceVariant
}
