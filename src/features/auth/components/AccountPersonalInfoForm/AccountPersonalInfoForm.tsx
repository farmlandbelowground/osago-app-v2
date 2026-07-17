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
    <div
      className={`mb-6 rounded-lg border border-border bg-surface p-6 shadow-sm`}
    >
      <h2 className="mb-1 font-serif text-[17px] font-medium text-foreground">
        Persoonlijke gegevens
      </h2>
      <p className="mb-3.5 text-[13px] text-muted-foreground">
        Deze gegevens worden gebruikt voor jouw account en in documenten zoals
        het verkoopmemorandum.
      </p>

      <form action={formAction}>
        <div className="grid grid-cols-2 gap-3.5">
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
        <div className="grid grid-cols-2 gap-3.5">
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

        <AccountFormSubmitButton isDisabled={isPending}>
          {isPending ? 'Opslaan…' : 'Wijzigingen opslaan'}
        </AccountFormSubmitButton>
      </form>
    </div>
  )
}
