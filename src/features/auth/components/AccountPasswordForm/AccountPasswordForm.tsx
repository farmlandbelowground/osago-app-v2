'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type FC } from 'react'
import { useForm } from 'react-hook-form'

import { useToastStore } from '@shared/store/toast'
import { getBrowserClient } from '@shared/supabase/browser'

import { PASSWORD_REQUIREMENTS_TOOLTIP } from '../../constants'
import { AccountPasswordSchema, type AccountPasswordInput } from '../../schema'
import { AccountFormSubmitButton } from '../AccountFormSubmitButton'
import { AuthField } from '../AuthField'
import { AuthTextInput } from '../AuthTextInput'
import { InfoTip } from '../InfoTip'
import { PasswordChecklist } from '../PasswordChecklist'
import { type Props } from './types'

export const AccountPasswordForm: FC<Props> = ({ email }) => {
  const showToast = useToastStore(state => state.showToast)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<AccountPasswordInput>({
    defaultValues: { confirmPassword: '', currentPassword: '', password: '' },
    mode: 'onBlur',
    resolver: zodResolver(AccountPasswordSchema),
  })

  const onSubmit = async (values: AccountPasswordInput): Promise<void> => {
    setSubmitError(null)
    const supabase = getBrowserClient()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: values.currentPassword,
    })

    if (signInError) {
      form.setError('currentPassword', {
        message: 'Jouw huidige wachtwoord klopt niet.',
      })
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: values.password,
    })

    if (updateError) {
      setSubmitError(updateError.message)
      return
    }

    form.reset({ confirmPassword: '', currentPassword: '', password: '' })
    showToast('Wachtwoord succesvol gewijzigd.')
  }

  const password = form.watch('password')

  return (
    <form className="card mb-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="form-section">
        <h3 className="form-section-title">Wachtwoord wijzigen</h3>
        <p className="form-section-desc">
          Kies een sterk wachtwoord. {PASSWORD_REQUIREMENTS_TOOLTIP} Laat alle
          velden leeg om jouw huidige wachtwoord te behouden.
        </p>

        {submitError && <p style={{ color: 'var(--danger)' }}>{submitError}</p>}

        <div style={{ maxWidth: 420 }}>
          <AuthField label="Huidig wachtwoord">
            <AuthTextInput
              {...form.register('currentPassword')}
              autoComplete="current-password"
              type="password"
            />
            {form.formState.errors.currentPassword && (
              <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 4 }}>
                {form.formState.errors.currentPassword.message}
              </p>
            )}
          </AuthField>
        </div>

        <div className="form-row" style={{ maxWidth: 'none' }}>
          <AuthField
            label={
              <>
                Nieuw wachtwoord
                <InfoTip tip={PASSWORD_REQUIREMENTS_TOOLTIP} />
              </>
            }
          >
            <AuthTextInput
              {...form.register('password')}
              autoComplete="new-password"
              type="password"
            />
            {form.formState.errors.password && (
              <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 4 }}>
                {form.formState.errors.password.message}
              </p>
            )}
            <PasswordChecklist password={password} />
          </AuthField>

          <AuthField label="Bevestig nieuw wachtwoord">
            <AuthTextInput
              {...form.register('confirmPassword')}
              autoComplete="new-password"
              type="password"
            />
            {form.formState.errors.confirmPassword && (
              <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 4 }}>
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </AuthField>
        </div>
      </div>

      <AccountFormSubmitButton isDisabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Bezig…' : 'Wachtwoord wijzigen'}
      </AccountFormSubmitButton>
    </form>
  )
}
