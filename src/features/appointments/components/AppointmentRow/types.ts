import { type ReactNode } from 'react'

import { type MyAppointmentView } from '../../types'

export interface Props {
  action: ReactNode
  appointment: MyAppointmentView
}
