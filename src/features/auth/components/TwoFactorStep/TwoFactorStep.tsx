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

      <form action={formAction} className="flex flex-col">
        <AuthField label="Inlogcode">
          <input type="hidden" name="code" value={code} />
          <div className="flex justify-between gap-2">
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
                className={`
                  h-14 flex-1 rounded-md border border-border bg-surface px-3.5
                  py-3 text-center font-mono text-2xl font-semibold
                  transition-[border-color,box-shadow] duration-150
                  focus:border-primary
                  focus:shadow-[0_0_0_3px_rgba(0,179,60,0.1)] focus:outline-none
                `}
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

      <div className="mt-6 text-center text-[14px] text-muted-foreground">
        <button
          type="button"
          onClick={onResend}
          disabled={isResending}
          className={`
            font-semibold text-primary
            hover:underline
            disabled:opacity-50
          `}
        >
          {isResending ? 'Versturen…' : 'Geen SMS ontvangen? Stuur opnieuw'}
        </button>
        <span className="mx-2 text-border">·</span>
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
