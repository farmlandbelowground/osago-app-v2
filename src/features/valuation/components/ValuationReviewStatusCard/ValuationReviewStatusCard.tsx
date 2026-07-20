'use client'

import { useState, type FC } from 'react'

import { submitValuationForReview } from '@features/valuation/actions'

import { type Props } from './types'

export const ValuationReviewStatusCard: FC<Props> = ({
  requiresReview,
  reviewStatus,
}) => {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!requiresReview) {
    return null
  }

  const onSubmit = async (): Promise<void> => {
    setIsPending(true)
    setError(null)
    const result = await submitValuationForReview()
    setIsPending(false)

    if (result.error !== null) {
      setError(result.error)
    }
  }

  if (reviewStatus === 'submitted') {
    return (
      <div className="alert alert-info mt-4">
        Je waardebepaling is ingediend ter controle. Een Osago-medewerker
        beoordeelt het materiaal binnen één werkdag.
      </div>
    )
  }

  if (reviewStatus === 'approved') {
    return (
      <div className="alert alert-success mt-4">
        Je waardebepaling is vrijgeschakeld.
      </div>
    )
  }

  return (
    <div className="card mt-4">
      <h3 className="form-section-title">Indienen ter controle</h3>
      <p className="text-sm text-muted mb-3">
        Bij het Waardebepaling Premium-pakket controleert een Osago-medewerker
        eerst jouw indicatieve waardering. Dien het materiaal hieronder in ter
        controle.
      </p>
      {error && <div className="alert alert-error mb-3">{error}</div>}
      <button
        className="btn btn-primary"
        disabled={isPending}
        onClick={() => void onSubmit()}
        type="button"
      >
        {isPending ? 'Bezig...' : 'Indienen ter controle'}
      </button>
    </div>
  )
}
