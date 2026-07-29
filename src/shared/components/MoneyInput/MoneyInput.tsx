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
    // Sanitize: strip alles behalve cijfers en minteken.
    const cleaned = event.target.value.replace(/[^\d-]/g, '')
    // Minteken is alleen geldig als leading character (positie 0). Overige
    // mintekens worden gestript, anders gaat parseInt('1-2000') fout (→ 1)
    // en verdwijnt een negatief teken achter cijfers (zoals '12000-' → 12000).
    const isNegative = cleaned.startsWith('-')
    const digitsOnly = cleaned.replace(/-/g, '')
    const normalized =
      digitsOnly === '' ? (isNegative ? '-' : '') : `${isNegative ? '-' : ''}${digitsOnly}`
    setRawText(normalized)
    const parsed = normalized === '' || normalized === '-'
      ? null
      : parseInt(normalized, 10)
    onChange(Number.isFinite(parsed) ? parsed : null)
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
