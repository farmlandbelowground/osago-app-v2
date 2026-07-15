'use client'

import Link from 'next/link'
import { useActionState, type FC } from 'react'

import { requestPasswordReset } from '../../actions'
import { AuthAlert } from '../AuthAlert'
import { AuthField } from '../AuthField'
import { AuthHeading } from '../AuthHeading'
import { AuthSubmitButton } from '../AuthSubmitButton'
import { AuthSubtitle } from '../AuthSubtitle'
import { AuthTextInput } from '../AuthTextInput'

export const ForgotPasswordForm: FC = () => {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    { status: 'idle' },
  )

  return (
    <div>
      <AuthHeading>Wachtwoord vergeten</AuthHeading>
      <AuthSubtitle>
        Vul je e-mailadres in. Als er een account bekend is, ontvang je
        binnen enkele minuten een e-mail met een link om een nieuw
        wachtwoord in te stellen.
      </AuthSubtitle>

      {state.status === 'sent' && (
        <AuthAlert variant="success">
          Als het adres bij ons bekend is, ontvang je zo een e-mail met een
          link om je wachtwoord opnieuw in te stellen. Controleer ook je
          spam-map.
        </AuthAlert>
      )}

      {state.status === 'error' && (
        <AuthAlert variant="error">{state.error}</AuthAlert>
      )}

      <form action={formAction} className="flex flex-col">
        <AuthField label="E-mailadres">
          <AuthTextInput
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="naam@bedrijf.nl"
          />
        </AuthField>

        <AuthSubmitButton isDisabled={isPending}>
          {isPending ? 'Bezig…' : 'Verstuur reset-link'}
        </AuthSubmitButton>
      </form>

      <div className="mt-6 text-center text-[14px]">
        <Link href="/" className={`
          font-semibold text-primary
          hover:underline
        `}>
          Terug naar inloggen
        </Link>
      </div>
    </div>
  )
}
