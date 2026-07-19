import { type FC, type ReactNode } from 'react'

import { KvkFieldBadge } from '../KvkFieldBadge'

interface Props {
  children: ReactNode
  kvkPrefilled: string[]
  label: string
  error?: string
  field?: string
}

export const CompanyFormField: FC<Props> = ({
  children,
  error,
  field,
  kvkPrefilled,
  label,
}) => {
  return (
    <div className="field">
      <label>
        {label}
        {field && <KvkFieldBadge field={field} kvkPrefilled={kvkPrefilled} />}
      </label>
      {children}
      {error && (
        <span style={{ color: 'var(--danger)', fontSize: '12px' }}>
          {error}
        </span>
      )}
    </div>
  )
}
