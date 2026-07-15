'use client'

import { type FC } from 'react'

import { AuthAlert } from '../AuthAlert'
import { AuthField } from '../AuthField'
import { AuthHeading } from '../AuthHeading'
import { AuthSubmitButton } from '../AuthSubmitButton'
import { AuthSubtitle } from '../AuthSubtitle'
import { AuthTextInput } from '../AuthTextInput'
import { type Props } from './types'

export const PhoneRequiredStep: FC<Props> = ({
  formAction,
  isPending,
  onCancel,
  phoneError,
}) => {
  return (
    <div>
      <AuthHeading>Telefoonnummer toevoegen</AuthHeading>
      <AuthSubtitle>
        Voor de tweestaps-verificatie hebben we jouw mobiele nummer nodig.
        Voeg &apos;m hieronder toe — we sturen daarna direct een SMS-code.
      </AuthSubtitle>

      {phoneError && <AuthAlert variant="error">{phoneError}</AuthAlert>}

      <form action={formAction} className="flex flex-col">
        <AuthField label="Mobiel telefoonnummer">
          <AuthTextInput
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+31 6 1234 5678"
          />
        </AuthField>

        <AuthSubmitButton isDisabled={isPending}>
          {isPending ? 'Bezig…' : 'Opslaan en SMS ontvangen'}
        </AuthSubmitButton>
      </form>

      <div className="mt-6 text-center text-[14px]">
        <button
          type="button"
          onClick={onCancel}
          className={`
            font-semibold text-primary
            hover:underline
          `}
        >
          Annuleren
        </button>
      </div>
    </div>
  )
}
