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
    <div
      className={`mb-6 rounded-lg border border-border bg-surface p-6 shadow-sm`}
    >
      <h2 className="mb-1 font-serif text-[17px] font-medium text-foreground">
        Wachtwoord wijzigen
      </h2>
      <p className="mb-3.5 text-[13px] text-muted-foreground">
        Kies een sterk wachtwoord. {PASSWORD_REQUIREMENTS_TOOLTIP} Laat alle
        velden leeg om jouw huidige wachtwoord te behouden.
      </p>

      {submitError && (
        <p className="mb-4 text-sm text-destructive">{submitError}</p>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="max-w-[420px]">
          <AuthField label="Huidig wachtwoord">
            <AuthTextInput
              {...form.register('currentPassword')}
              autoComplete="current-password"
              type="password"
            />
            {form.formState.errors.currentPassword && (
              <p className="mt-1 text-[13px] text-destructive">
                {form.formState.errors.currentPassword.message}
              </p>
            )}
          </AuthField>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
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
              <p className="mt-1 text-[13px] text-destructive">
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
              <p className="mt-1 text-[13px] text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </AuthField>
        </div>

        <AccountFormSubmitButton isDisabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Bezig…' : 'Wachtwoord wijzigen'}
        </AccountFormSubmitButton>
      </form>
    </div>
  )
}
