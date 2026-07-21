'use client'

import { useTransition, type FC } from 'react'

import { useToastStore } from '@shared/store/toast'

import { identifyBuyers } from '../../actions'
import { type Props } from './types'

// Triggers the AI identification flow (ports startAutoLeadIdentification's
// invocation + toasts, osago-bundle.js:21149-21226). Rendered as the header
// "Opnieuw zoeken"/"Verversen" button and the empty-state start button.
export const AutoLeadRefreshButton: FC<Props> = ({ hasLeads, variant }) => {
  const [isPending, startTransition] = useTransition()
  const showToast = useToastStore(state => state.showToast)

  const onClick = (): void => {
    startTransition(async () => {
      const result = await identifyBuyers()
      if (result.error !== null) {
        showToast(result.error, 'error')
        return
      }
      if (result.data.count > 0) {
        showToast(
          `${result.data.count} potentiële koper${
            result.data.count === 1 ? '' : 's'
          } gevonden.`,
        )
      } else {
        showToast(
          'Geen passende kopers gevonden. Probeer je bedrijfsprofiel aan te vullen.',
        )
      }
    })
  }

  if (variant === 'start') {
    return (
      <button
        className="btn btn-primary"
        disabled={isPending}
        onClick={onClick}
        style={{ marginTop: '14px' }}
        type="button"
      >
        {!isPending && (
          <svg
            fill="none"
            height="14"
            stroke="currentColor"
            strokeWidth="2"
            style={{ marginRight: '4px', verticalAlign: '-2px' }}
            viewBox="0 0 24 24"
            width="14"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
        {isPending ? 'Bezig met zoeken…' : 'Automatische identificatie starten'}
      </button>
    )
  }

  return (
    <button
      className="btn btn-secondary btn-sm"
      disabled={isPending}
      onClick={onClick}
      type="button"
    >
      {!isPending && (
        <svg
          fill="none"
          height="13"
          stroke="currentColor"
          strokeWidth="2"
          style={{ marginRight: '4px', verticalAlign: '-2px' }}
          viewBox="0 0 24 24"
          width="13"
        >
          <path d="M23 4v6h-6M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      )}
      {isPending
        ? 'Bezig met zoeken…'
        : hasLeads
          ? 'Opnieuw zoeken'
          : 'Verversen'}
    </button>
  )
}
