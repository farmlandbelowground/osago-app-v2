'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FC } from 'react'
import { useForm } from 'react-hook-form'

import { getBrowserClient } from '@shared/supabase/browser'

import {
  LOGIN_PATH,
  PASSWORD_REQUIREMENTS_TOOLTIP,
  PASSWORD_RESET_REDIRECT_DELAY_MS,
  PASSWORD_RESET_SESSION_POLL_INTERVAL_MS,
  PASSWORD_RESET_SESSION_TIMEOUT_MS,
} from '../../constants'
import { ResetPasswordSchema, type ResetPasswordInput } from '../../schema'
import { AuthAlert } from '../AuthAlert'
import { AuthField } from '../AuthField'
import { AuthHeading } from '../AuthHeading'
import { AuthSubmitButton } from '../AuthSubmitButton'
import { AuthSubtitle } from '../AuthSubtitle'
import { AuthTextInput } from '../AuthTextInput'
import { InfoTip } from '../InfoTip'
import { PasswordChecklist } from '../PasswordChecklist'

export const ResetPasswordForm: FC = () => {
  const router = useRouter()
  const [isSessionReady, setIsSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<ResetPasswordInput>({
    defaultValues: { confirmPassword: '', password: '' },
    mode: 'onBlur',
    resolver: zodResolver(ResetPasswordSchema),
  })

  useEffect(() => {
    let isCancelled = false
    const startedAt = Date.now()

    const waitForRecoverySession = async (): Promise<void> => {
      while (Date.now() - startedAt < PASSWORD_RESET_SESSION_TIMEOUT_MS) {
        const { data } = await getBrowserClient().auth.getSession()

        if (data.session) {
          if (!isCancelled) {
            setIsSessionReady(true)
          }
          return
        }

        await new Promise(resolve => {
          setTimeout(resolve, PASSWORD_RESET_SESSION_POLL_INTERVAL_MS)
        })
      }

      if (!isCancelled) {
        setSessionError(
          'De reset-link is verlopen of ongeldig. Vraag een nieuwe aan.',
        )
      }
    }

    void waitForRecoverySession()

    return () => {
      isCancelled = true
    }
  }, [])

  const onSubmit = async (values: ResetPasswordInput): Promise<void> => {
    setSubmitError(null)
    const { error } = await getBrowserClient().auth.updateUser({
      password: values.password,
    })

    if (error) {
      setSubmitError(error.message)
      return
    }

    await getBrowserClient().auth.signOut()
    setIsSuccess(true)
    setTimeout(() => router.push(LOGIN_PATH), PASSWORD_RESET_REDIRECT_DELAY_MS)
  }

  const password = form.watch('password')

  return (
    <div>
      <AuthHeading>Kies een nieuw wachtwoord</AuthHeading>
      <AuthSubtitle>
        Vul hieronder je nieuwe wachtwoord in. Na opslaan word je direct
        naar de app gestuurd.
      </AuthSubtitle>

      {sessionError && <AuthAlert variant="error">{sessionError}</AuthAlert>}
      {submitError && <AuthAlert variant="error">{submitError}</AuthAlert>}
      {isSuccess && (
        <AuthAlert variant="success">
          Je wachtwoord is bijgewerkt. Log in met je nieuwe wachtwoord.
        </AuthAlert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)}>
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
            type="password"
            placeholder="Minimaal 9 tekens"
            autoComplete="new-password"
            aria-invalid={form.formState.errors.password ? 'true' : 'false'}
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
            type="password"
            autoComplete="new-password"
            aria-invalid={
              form.formState.errors.confirmPassword ? 'true' : 'false'
            }
          />
          {form.formState.errors.confirmPassword && (
            <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 4 }}>
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </AuthField>

        <AuthSubmitButton
          isDisabled={!isSessionReady || form.formState.isSubmitting || isSuccess}
        >
          {form.formState.isSubmitting ? 'Opslaan…' : 'Wachtwoord opslaan'}
        </AuthSubmitButton>
      </form>
    </div>
  )
}
