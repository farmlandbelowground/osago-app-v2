'use client'

import { useActionState, useEffect, type FC } from 'react'

import { useToastStore } from '@shared/store/toast'

import { updatePersonalInfo } from '../../actions'
import { type UpdatePersonalInfoState } from '../../types'
import { AccountFormSubmitButton } from '../AccountFormSubmitButton'
import { AuthField } from '../AuthField'
import { AuthTextInput } from '../AuthTextInput'
import { type Props } from './types'

const initialState: UpdatePersonalInfoState = { error: '', success: false }

export const AccountPersonalInfoForm: FC<Props> = ({ profile }) => {
  const showToast = useToastStore(state => state.showToast)
  const [state, formAction, isPending] = useActionState(
    updatePersonalInfo,
    initialState,
  )

  useEffect(() => {
    if (state.success) {
      showToast('Persoonlijke gegevens opgeslagen.')
      return
    }

    if (state.error) {
      showToast(state.error, 'error')
    }
  }, [showToast, state])

  return (
    <form action={formAction} className="card mb-5">
      <div className="form-section">
        <h3 className="form-section-title">Persoonlijke gegevens</h3>
        <p className="form-section-desc">
          Deze gegevens worden gebruikt voor jouw account en in documenten
          zoals het verkoopmemorandum.
        </p>
        <div className="form-row">
          <AuthField label="Voornaam">
            <AuthTextInput
              defaultValue={profile.firstName ?? ''}
              name="firstName"
              required
            />
          </AuthField>
          <AuthField label="Achternaam">
            <AuthTextInput
              defaultValue={profile.lastName ?? ''}
              name="lastName"
              required
            />
          </AuthField>
        </div>
        <div className="form-row">
          <AuthField label="E-mailadres">
            <AuthTextInput
              defaultValue={profile.email}
              name="email"
              required
              type="email"
            />
          </AuthField>
          <AuthField label="Telefoonnummer">
            <AuthTextInput
              defaultValue={profile.phone ?? ''}
              name="phone"
              placeholder="+31 6 1234 5678"
              required
              type="tel"
            />
          </AuthField>
        </div>
      </div>

      <AccountFormSubmitButton isDisabled={isPending}>
        {isPending ? 'Opslaan…' : 'Wijzigingen opslaan'}
      </AccountFormSubmitButton>
    </form>
  )
}
