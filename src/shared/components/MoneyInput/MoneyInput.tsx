'use client'

import { useState, type ChangeEvent, type FC } from 'react'

import { type Props } from './types'

export const MoneyInput: FC<Props> = ({
  isDisabled,
  onChange,
  placeholder = '0',
  value,
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [rawText, setRawText] = useState('')

  const onInputFocus = (): void => {
    setRawText(value === null ? '' : String(value))
    setIsFocused(true)
  }

  const onInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const digitsOnly = event.target.value.replace(/[^\d-]/g, '')
    setRawText(digitsOnly)
    onChange(
      digitsOnly === '' || digitsOnly === '-' ? null : parseInt(digitsOnly, 10),
    )
  }

  const displayValue = isFocused
    ? rawText
    : value === null
      ? ''
      : value.toLocaleString('nl-NL')

  return (
    <div className="fin-input-wrap">
      <span className="fin-input-prefix">€</span>
      <input
        disabled={isDisabled}
        inputMode="numeric"
        onBlur={() => setIsFocused(false)}
        onChange={onInputChange}
        onFocus={onInputFocus}
        placeholder={placeholder}
        type="text"
        value={displayValue}
      />
    </div>
  )
}
