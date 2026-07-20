'use client'

import { useState, type ChangeEvent, type FC } from 'react'

import { validateVoucherCode } from '../../actions'
import { formatEuro } from '../../lib/formatEuro'
import { type AppliedVoucher, type Props } from './types'

export const VoucherCodeField: FC<Props> = ({
  onApplied,
  onCleared,
  planId,
}) => {
  const [code, setCode] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState<AppliedVoucher | null>(null)

  const onChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setCode(event.target.value)

    if (applied) {
      setApplied(null)
      setError(null)
      onCleared()
    }
  }

  const onApply = async (): Promise<void> => {
    if (!code.trim()) {
      return
    }

    setIsPending(true)
    setError(null)
    const result = await validateVoucherCode(code, planId)
    setIsPending(false)

    if (!result.valid) {
      setError(result.reason)
      return
    }

    const voucher: AppliedVoucher = {
      code: code.trim().toUpperCase(),
      discount: result.discount,
      voucherId: result.voucherId,
    }

    setApplied(voucher)
    onApplied(voucher)
  }

  return (
    <div className="field" style={{ marginBottom: 14 }}>
      <label>Vouchercode (optioneel)</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <input
          autoCapitalize="characters"
          autoComplete="off"
          disabled={isPending}
          onChange={onChange}
          placeholder="Bijv. WELKOM10"
          style={{
            flex: 1,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: "'Inter', sans-serif",
          }}
          type="text"
          value={code}
        />
        <button
          className="btn btn-secondary"
          disabled={isPending || !code.trim()}
          onClick={() => void onApply()}
          style={{ whiteSpace: 'nowrap' }}
          type="button"
        >
          Toepassen
        </button>
      </div>
      <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.4 }}>
        {applied && (
          <span style={{ color: 'var(--green-dark)', fontWeight: 500 }}>
            ✓ {applied.code} toegepast — je bespaart{' '}
            {formatEuro(applied.discount)}
          </span>
        )}
        {error && <span style={{ color: 'var(--danger)' }}>✕ {error}</span>}
      </div>
    </div>
  )
}
