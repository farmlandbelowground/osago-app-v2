import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import { PASSWORD_MIN_LENGTH } from '../../constants'
import { type PasswordCheck, type Props } from './types'

export const PasswordChecklist: FC<Props> = ({ password }) => {
  if (!password) {
    return null
  }

  const checks: PasswordCheck[] = [
    {
      isMet: password.length >= PASSWORD_MIN_LENGTH,
      label: `Minimaal ${PASSWORD_MIN_LENGTH} tekens`,
    },
    { isMet: /[a-zA-Z]/.test(password), label: 'Bevat ten minste 1 letter' },
    { isMet: /[0-9]/.test(password), label: 'Bevat ten minste 1 cijfer' },
    {
      isMet: /[^a-zA-Z0-9\s]/.test(password),
      label: 'Bevat ten minste 1 symbool',
    },
  ]

  return (
    <ul className="pwd-checklist">
      {checks.map(check => (
        <li
          key={check.label}
          className={cn(check.isMet ? 'ok' : 'pending')}
        >
          <span aria-hidden="true">{check.isMet ? '✓' : '•'}</span>
          {check.label}
        </li>
      ))}
    </ul>
  )
}
