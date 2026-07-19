'use client'

import Link from 'next/link'
import { useActionState, useState, type FC } from 'react'

import { verifyEmailCode } from '../../actions'
import { AuthAlert } from '../AuthAlert'
import { AuthField } from '../AuthField'
import { AuthHeading } from '../AuthHeading'
import { AuthSubmitButton } from '../AuthSubmitButton'
import { AuthSubtitle } from '../AuthSubtitle'
import { AuthTextInput } from '../AuthTextInput'

export const VerifyEmailForm: FC = () => {
  const [state, formAction, isPending] = useActionState(verifyEmailCode, {
    status: 'idle',
  })
  const [showResendNote, setShowResendNote] = useState(false)

  return (
    <div>
      <AuthHeading>Bevestig je e-mailadres</AuthHeading>
      <AuthSubtitle>
        We hebben een bevestigingscode verzonden naar jouw e-mailadres. Vul
        de 6-cijferige code in om jouw account te activeren.
      </AuthSubtitle>

      {state.status === 'unavailable' && (
        <AuthAlert variant="info">{state.message}</AuthAlert>
      )}
      {state.status === 'error' && (
        <AuthAlert variant="error">{state.error}</AuthAlert>
      )}
      {showResendNote && (
        <AuthAlert variant="info">
          E-mailverificatie is momenteel niet beschikbaar.
        </AuthAlert>
      )}

      <form action={formAction}>
        <AuthField label="Bevestigingscode">
          <AuthTextInput
            name="code"
            type="text"
            required
            maxLength={6}
            inputMode="numeric"
            pattern="[0-9]{6}"
            autoComplete="one-time-code"
            placeholder="123456"
            style={{
              fontFamily: "'Inter', monospace",
              fontSize: 22,
              letterSpacing: 8,
              textAlign: 'center',
            }}
          />
        </AuthField>

        <AuthSubmitButton isDisabled={isPending}>
          {isPending ? 'Bezig…' : 'Account activeren'}
        </AuthSubmitButton>
      </form>

      <div className="auth-toggle">
        Geen code ontvangen?{' '}
        <button
          onClick={() => setShowResendNote(true)}
          style={{ color: 'var(--green)', fontWeight: 600 }}
          type="button"
        >
          Stuur opnieuw
        </button>
        <span style={{ color: 'var(--line)', margin: '0 8px' }}>·</span>
        <Link href="/">Terug naar inloggen</Link>
      </div>
    </div>
  )
}
