'use client'

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FC,
  type KeyboardEvent,
} from 'react'

import { TWO_FACTOR_CODE_LENGTH } from '../../constants'
import { AuthAlert } from '../AuthAlert'
import { AuthField } from '../AuthField'
import { AuthHeading } from '../AuthHeading'
import { AuthSubmitButton } from '../AuthSubmitButton'
import { AuthSubtitle } from '../AuthSubtitle'
import { type Props } from './types'

export const TwoFactorStep: FC<Props> = ({
  formAction,
  isPending,
  isResending,
  onCancel,
  onResend,
  phoneMasked,
  resendError,
  verifyError,
}) => {
  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length: TWO_FACTOR_CODE_LENGTH }, () => ''),
  )
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (verifyError) {
      inputRefs.current[0]?.focus()
    }
  }, [verifyError])

  const onDigitChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    const value = event.target.value.replace(/\D/g, '').slice(-1)

    setDigits(previous => {
      const next = [...previous]
      next[index] = value
      return next
    })

    if (value && index < TWO_FACTOR_CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const onDigitKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const onDigitPaste = (event: ClipboardEvent<HTMLInputElement>): void => {
    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, TWO_FACTOR_CODE_LENGTH)

    if (!pasted) {
      return
    }

    event.preventDefault()
    setDigits(previous => {
      const next = [...previous]
      pasted.split('').forEach((digit, index) => {
        next[index] = digit
      })
      return next
    })
    const nextFocusIndex = Math.min(pasted.length, TWO_FACTOR_CODE_LENGTH - 1)
    inputRefs.current[nextFocusIndex]?.focus()
  }

  const code = digits.join('')
  const alertMessage = verifyError ?? resendError

  return (
    <div>
      <AuthHeading>Tweestaps-verificatie</AuthHeading>
      <AuthSubtitle>
        We hebben een SMS met een 6-cijferige code verzonden naar{' '}
        <strong>{phoneMasked || 'jouw telefoonnummer'}</strong>. Vul de code
        in om door te gaan.
      </AuthSubtitle>

      {alertMessage && <AuthAlert variant="error">{alertMessage}</AuthAlert>}

      <form action={formAction}>
        <AuthField label="Inlogcode">
          <input type="hidden" name="code" value={code} />
          <div
            className="twofa-code-boxes"
            style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}
          >
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={element => {
                  inputRefs.current[index] = element
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                value={digit}
                onChange={event => onDigitChange(index, event)}
                onKeyDown={event => onDigitKeyDown(index, event)}
                onPaste={onDigitPaste}
                className="twofa-code-digit"
                style={{
                  flex: 1,
                  fontFamily: "'Inter', monospace",
                  fontSize: 24,
                  fontWeight: 600,
                  height: 56,
                  minWidth: 0,
                  textAlign: 'center',
                }}
              />
            ))}
          </div>
        </AuthField>

        <AuthSubmitButton
          isDisabled={isPending || code.length < TWO_FACTOR_CODE_LENGTH}
        >
          {isPending ? 'Bezig…' : 'Inloggen voltooien'}
        </AuthSubmitButton>
      </form>

      <div className="auth-toggle">
        <button
          onClick={onResend}
          disabled={isResending}
          style={{ color: 'var(--green)', fontWeight: 600 }}
          type="button"
        >
          {isResending ? 'Versturen…' : 'Geen SMS ontvangen? Stuur opnieuw'}
        </button>
        <span style={{ color: 'var(--line)', margin: '0 8px' }}>·</span>
        <button
          onClick={onCancel}
          style={{ color: 'var(--green)', fontWeight: 600 }}
          type="button"
        >
          Annuleren
        </button>
      </div>
    </div>
  )
}
