'use client'

import { useRouter } from 'next/navigation'
import { useState, type ChangeEvent, type FC } from 'react'

import { makeValuation } from '@features/valuation/actions'

import { type Props } from './types'

export const ValuationLockInModal: FC<Props> = ({ isOpen, onClose }) => {
  const router = useRouter()
  const [isAgreed, setIsAgreed] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) {
    return null
  }

  const onAgreeChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setIsAgreed(event.target.checked)
  }

  const onConfirm = async (): Promise<void> => {
    setIsPending(true)
    setError(null)
    const result = await makeValuation({ agreed: true })
    setIsPending(false)

    if (result.error !== null) {
      setError(result.error)
      return
    }

    onClose()
    router.refresh()
  }

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" onClick={event => event.stopPropagation()}>
        <div className="modal-header">
          <h3>Waardering maken — éénmalige actie</h3>
          <button
            aria-label="Sluiten"
            className="modal-close"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div
            className="alert alert-amber"
            style={{
              borderRadius: 'var(--radius-sm)',
              color: 'var(--ink)',
              fontSize: 13.5,
              lineHeight: 1.55,
              marginBottom: 16,
              padding: '14px 16px',
            }}
          >
            <strong style={{ color: '#92400E' }}>Let op:</strong> de indicatieve
            waardebepaling kan slechts één keer worden gemaakt. Na het maken
            wordt de waardering vastgelegd op basis van jouw huidige financiële
            gegevens, value drivers en het waarderingsrapport. Latere
            wijzigingen aan deze pagina’s hebben geen effect meer op de getoonde
            waardering of het PDF-rapport.
          </div>
          <p className="text-sm" style={{ margin: '0 0 14px' }}>
            Weet je zeker dat je nu een waardering wilt maken?
          </p>
          <label
            style={{
              alignItems: 'flex-start',
              cursor: 'pointer',
              display: 'flex',
              gap: 10,
              padding: '6px 2px',
            }}
          >
            <input
              checked={isAgreed}
              onChange={onAgreeChange}
              style={{
                accentColor: 'var(--green)',
                cursor: 'pointer',
                flexShrink: 0,
                height: 16,
                marginTop: 3,
                width: 16,
              }}
              type="checkbox"
            />
            <span
              style={{ color: 'var(--ink-2)', fontSize: 13, lineHeight: 1.5 }}
            >
              Ik begrijp dat de waardering daarna niet meer wijzigt — ook niet
              als ik de financiële gegevens, value drivers of het
              waarderingsrapport later aanpas.
            </span>
          </label>
          {error && <div className="alert alert-error mt-4">{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Annuleren
          </button>
          <button
            className="btn btn-primary"
            disabled={!isAgreed || isPending}
            onClick={() => void onConfirm()}
            type="button"
          >
            {isPending ? 'Bezig...' : 'Waardering maken'}
          </button>
        </div>
      </div>
    </div>
  )
}
