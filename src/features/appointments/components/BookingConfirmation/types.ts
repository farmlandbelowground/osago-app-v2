import { type ReactNode } from 'react'

import { type AppointmentType, type ConfirmedBooking } from '../../types'

export interface Props {
  adminName: string
  booking: ConfirmedBooking
  type: AppointmentType
  action?: ReactNode
}
