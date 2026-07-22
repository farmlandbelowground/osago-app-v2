'use client'

import { type FC, useState } from 'react'

import { useToastStore } from '@shared/store/toast'

// Legacy parity (OQ-5): the customer self-cancel sends the cancellation e-mail and
// optimistically hides the row on screen, but does NOT persist to Supabase — RLS
// forbids a customer updating a booking. The row therefore returns as 'confirmed'
// on a hard refresh, exactly as legacy behaved. A future service-role-backed
// authoritative cancel is the intended follow-up.
import { sendMyBookingCancellation } from '../../actions'
import { CANCEL_MIN_NOTICE_MS } from '../../constants'
import { fmtAppointmentDate, fmtAppointmentTime } from '../../lib/format'
import { AppointmentRow } from '../AppointmentRow'
import { type Props } from './types'

export const MyAppointmentCancelButton: FC<Props> = ({ appointment }) => {
  const showToast = useToastStore(state => state.showToast)
  const [isHidden, setIsHidden] = useState(false)

  if (isHidden) {
    return null
  }

  const onCancel = async (): Promise<void> => {
    if (appointment.startsAt - Date.now() < CANCEL_MIN_NOTICE_MS) {
      showToast(
        'Annuleren kan niet meer korter dan 1 uur vóór de afspraak. Bel ons direct.',
        'error',
      )
      return
    }

    const confirmed = window.confirm(
      `Weet je zeker dat je de afspraak op ${fmtAppointmentDate(appointment.startsAt)} om ${fmtAppointmentTime(appointment.startsAt)} wilt annuleren? De adviseur ontvangt automatisch bericht.`,
    )
    if (!confirmed) {
      return
    }

    const result = await sendMyBookingCancellation(appointment.id)
    if (result.error) {
      showToast(result.error, 'error')
      return
    }

    setIsHidden(true)
    showToast('Afspraak geannuleerd.')
  }

  return (
    <AppointmentRow
      action={
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => void onCancel()}
          style={{ color: 'var(--danger)' }}
          type="button"
        >
          Annuleren
        </button>
      }
      appointment={appointment}
    />
  )
}
