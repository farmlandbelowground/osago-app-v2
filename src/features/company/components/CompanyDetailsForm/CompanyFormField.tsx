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
    <label className="mb-[18px] flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-foreground-secondary">
        {label}
        {field && <KvkFieldBadge field={field} kvkPrefilled={kvkPrefilled} />}
      </span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  )
}
