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
    <div className="mb-4">
      <label
        className={`
          mb-1.5 block text-[13px] font-medium text-foreground-secondary
        `}
      >
        Vouchercode (optioneel)
      </label>
      <div className="flex gap-2">
        <input
          className={`
            w-full rounded-md border border-border bg-surface px-3.5 py-2.5
            text-sm
            focus:border-primary focus:outline-none
          `}
          disabled={isPending}
          onChange={onChange}
          placeholder="Bijv. WELKOM10"
          type="text"
          value={code}
        />
        <button
          className={`
            shrink-0 rounded-md border border-border bg-background px-4 py-2.5
            text-sm font-semibold text-foreground transition
            hover:bg-border-soft
            disabled:opacity-50
          `}
          disabled={isPending || !code.trim()}
          onClick={() => void onApply()}
          type="button"
        >
          Toepassen
        </button>
      </div>
      {applied && (
        <p className="mt-2 text-[13px] font-medium text-primary-hover">
          ✓ {applied.code} toegepast — je bespaart{' '}
          {formatEuro(applied.discount)}
        </p>
      )}
      {error && <p className="mt-2 text-[13px] text-destructive">✕ {error}</p>}
    </div>
  )
}
