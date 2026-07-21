import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import { type Props } from './types'

// Ports osagoBadge (osago-bundle.js:3348-3358). Renders nothing for a lead that
// is not Osago-validated. The tooltip falls back to the generic text since v2
// stores validated_by as a uuid, not a display name.
export const OsagoBadge: FC<Props> = ({ lead, size }) => {
  if (!lead.validatedByOsago) {
    return null
  }

  return (
    <span
      className={cn('osago-badge', size === 'lg' && 'osago-badge-lg')}
      title="Geverifieerd door Osago"
    >
      <svg fill="currentColor" height="11" viewBox="0 0 24 24" width="11">
        <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" />
      </svg>
      Gevalideerd door Osago
    </span>
  )
}
