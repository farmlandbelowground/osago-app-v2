'use client'

import Link from 'next/link'
import { useActionState, type FC } from 'react'

import { login } from '../../actions'
import { useTwoFactorFlow } from '../../hooks/useTwoFactorFlow'
import { AuthAlert } from '../AuthAlert'
import { AuthField } from '../AuthField'
import { AuthHeading } from '../AuthHeading'
import { AuthSubmitButton } from '../AuthSubmitButton'
import { AuthTextInput } from '../AuthTextInput'
import { PhoneRequiredStep } from '../PhoneRequiredStep'
import { TurnstileWidget } from '../TurnstileWidget'
import { TwoFactorStep } from '../TwoFactorStep'

export const LoginForm: FC = () => {
  const [state, formAction, isPending] = useActionState(login, {
    status: 'idle',
  })
  const twoFactor = useTwoFactorFlow({ flowState: state })

  if (state.status === 'twofa' || state.status === 'phone-required') {
    if (twoFactor.step === 'twofa') {
      return (
        <TwoFactorStep
          formAction={twoFactor.verifyFormAction}
          isPending={twoFactor.isVerifying}
          isResending={twoFactor.isResending}
          onCancel={twoFactor.onCancel}
          onResend={twoFactor.onResend}
          phoneMasked={twoFactor.phoneMasked}
          resendError={twoFactor.resendError}
          verifyError={
            twoFactor.verifyState.status === 'error'
              ? twoFactor.verifyState.error
              : null
          }
        />
      )
    }

    return (
      <PhoneRequiredStep
        formAction={twoFactor.phoneFormAction}
        isPending={twoFactor.isSavingPhone}
        onCancel={twoFactor.onCancel}
        phoneError={twoFactor.phoneError}
      />
    )
  }

  return (
    <div>
      <AuthHeading>Welkom terug</AuthHeading>

      {state.status === 'error' && (
        <AuthAlert variant="error">{state.error}</AuthAlert>
      )}

      <form action={formAction}>
        <AuthField label="E-mailadres">
          <AuthTextInput
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="naam@bedrijf.nl"
          />
        </AuthField>

        <AuthField label="Wachtwoord">
          <AuthTextInput
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </AuthField>

        <TurnstileWidget
          name="turnstileToken"
          resetSignal={state.status === 'error' ? state : undefined}
        />

        <AuthSubmitButton isDisabled={isPending}>
          {isPending ? 'Bezig…' : 'Inloggen'}
        </AuthSubmitButton>
      </form>

      <div className="auth-toggle">
        Nog geen account?{' '}
        <Link href="/registreer">Registreer hier</Link>
        <span style={{ color: 'var(--line)', margin: '0 8px' }}>·</span>
        <Link href="/wachtwoord-vergeten">Wachtwoord vergeten?</Link>
      </div>
    </div>
  )
}
