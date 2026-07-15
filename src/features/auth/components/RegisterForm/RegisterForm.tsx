'use client'

import Link from 'next/link'
import { useActionState, useState, type ChangeEvent, type FC } from 'react'

import { register } from '../../actions'
import { PASSWORD_REQUIREMENTS_TOOLTIP } from '../../constants'
import { useTwoFactorFlow } from '../../hooks/useTwoFactorFlow'
import { AuthAlert } from '../AuthAlert'
import { AuthField } from '../AuthField'
import { AuthHeading } from '../AuthHeading'
import { AuthSubmitButton } from '../AuthSubmitButton'
import { AuthTextInput } from '../AuthTextInput'
import { InfoTip } from '../InfoTip'
import { PasswordChecklist } from '../PasswordChecklist'
import { PhoneRequiredStep } from '../PhoneRequiredStep'
import { TurnstileWidget } from '../TurnstileWidget'
import { TwoFactorStep } from '../TwoFactorStep'

interface RegisterFormValues {
  email: string
  firstName: string
  lastName: string
  phone: string
}

const initialFormValues: RegisterFormValues = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
}

export const RegisterForm: FC = () => {
  const [state, formAction, isPending] = useActionState(register, {
    status: 'idle',
  })
  const [password, setPassword] = useState('')
  const [formValues, setFormValues] = useState(initialFormValues)
  const twoFactor = useTwoFactorFlow({ flowState: state })

  const onPasswordChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setPassword(event.target.value)
  }

  const onFieldChange =
    (field: keyof RegisterFormValues) =>
    (event: ChangeEvent<HTMLInputElement>): void => {
      setFormValues((previous) => ({
        ...previous,
        [field]: event.target.value,
      }))
    }

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
      <AuthHeading>Account aanmaken</AuthHeading>

      {state.status === 'error' && (
        <AuthAlert variant="error">{state.error}</AuthAlert>
      )}

      <form action={formAction} className="flex flex-col">
        <div className="grid grid-cols-2 gap-3.5">
          <AuthField label="Voornaam">
            <AuthTextInput
              name="firstName"
              type="text"
              required
              value={formValues.firstName}
              onChange={onFieldChange('firstName')}
            />
          </AuthField>

          <AuthField label="Achternaam">
            <AuthTextInput
              name="lastName"
              type="text"
              required
              value={formValues.lastName}
              onChange={onFieldChange('lastName')}
            />
          </AuthField>
        </div>

        <AuthField label="E-mailadres">
          <AuthTextInput
            name="email"
            type="email"
            required
            autoComplete="email"
            value={formValues.email}
            onChange={onFieldChange('email')}
          />
        </AuthField>

        <AuthField label="Telefoonnummer">
          <AuthTextInput
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+31 6 1234 5678"
            value={formValues.phone}
            onChange={onFieldChange('phone')}
          />
        </AuthField>

        <AuthField
          label={
            <div className='flex items-center'>
              Wachtwoord
              <InfoTip tip={PASSWORD_REQUIREMENTS_TOOLTIP} />
            </div>
          }
        >
          <AuthTextInput
            name="password"
            type="password"
            required
            minLength={9}
            placeholder="Minimaal 9 tekens"
            value={password}
            onChange={onPasswordChange}
          />
          <PasswordChecklist password={password} />
        </AuthField>

        <div className="mb-1">
          <TurnstileWidget
            name="turnstileToken"
            resetSignal={state.status === 'error' ? state : undefined}
          />
        </div>

        <AuthSubmitButton isDisabled={isPending}>
          {isPending ? 'Bezig…' : 'Account aanmaken'}
        </AuthSubmitButton>
      </form>

      <div className="mt-6 text-center text-[14px] text-muted-foreground">
        Heb je al een account?{' '}
        <Link href="/" className={`
          font-semibold text-primary
          hover:underline
        `}>
          Log hier in
        </Link>
      </div>
    </div>
  )
}
