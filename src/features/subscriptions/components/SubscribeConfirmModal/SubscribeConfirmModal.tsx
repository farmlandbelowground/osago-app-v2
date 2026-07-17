'use client'

import { useRouter } from 'next/navigation'
import { useState, type ChangeEvent, type FC } from 'react'

import { createSubscriptionPayment } from '../../actions'
import {
  ABONNEMENT_AFSLUITEN_PATH,
  SUBSCRIPTION_DURATION_MONTHS,
  VAT_RATE,
} from '../../constants'
import { addMonths } from '../../lib/addMonths'
import { formatDateNl } from '../../lib/formatDateNl'
import { formatEuro } from '../../lib/formatEuro'
import { ModalShell } from '../ModalShell'
import { VoucherCodeField, type AppliedVoucher } from '../VoucherCodeField'
import { type Props } from './types'

export const SubscribeConfirmModal: FC<Props> = ({ plan }) => {
  const router = useRouter()
  const [voucher, setVoucher] = useState<AppliedVoucher | null>(null)
  const [isConsentChecked, setIsConsentChecked] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onClose = (): void => {
    router.push(ABONNEMENT_AFSLUITEN_PATH)
  }

  const onConsentChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setIsConsentChecked(event.target.checked)
  }

  const startDate = new Date()
  const endDate = addMonths(startDate, SUBSCRIPTION_DURATION_MONTHS)
  const discount = voucher?.discount ?? 0
  const netAfterDiscount = plan.price - discount
  const vatAmount = netAfterDiscount * VAT_RATE
  const totalGross = netAfterDiscount + vatAmount

  const onSubmit = async (): Promise<void> => {
    setIsPending(true)
    setError(null)
    const result = await createSubscriptionPayment(plan.id, voucher?.code)
    setIsPending(false)

    if (result.error !== null) {
      setError(result.error)
      return
    }

    window.location.href = result.checkoutUrl
  }

  return (
    <ModalShell onClose={onClose} title="Abonnement bevestigen">
      <p className="mb-4 text-[13px] text-muted-foreground">
        Je staat op het punt het volgende abonnement te activeren:
      </p>

      <div
        className={`
          mb-4 rounded-md border border-border bg-background px-4 py-3.5
        `}
      >
        <div className="font-semibold text-foreground">{plan.label}</div>
        <p className="text-xs text-muted-foreground">{plan.desc}</p>
        <div className="mt-2 text-sm font-semibold text-foreground">
          {formatEuro(plan.price)}{' '}
          {plan.category === 'full' && (
            <span className="font-normal text-muted-foreground">
              per 6 maanden
            </span>
          )}
        </div>
      </div>

      {plan.category === 'full' && (
        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Startdatum</div>
            <div className="font-semibold text-foreground">
              {formatDateNl(startDate.toISOString())}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Einddatum</div>
            <div className="font-semibold text-foreground">
              {formatDateNl(endDate.toISOString())}
            </div>
          </div>
        </div>
      )}

      <VoucherCodeField
        onApplied={setVoucher}
        onCleared={() => setVoucher(null)}
        planId={plan.id}
      />

      <div
        className={`
          mb-4 rounded-md border border-border bg-background px-4 py-3.5 text-sm
        `}
      >
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">Subtotaal (excl. BTW)</span>
          <span className="text-foreground">{formatEuro(plan.price)}</span>
        </div>
        {voucher && (
          <div className="flex justify-between py-1 text-primary-hover">
            <span>Korting ({voucher.code})</span>
            <span>-{formatEuro(discount)}</span>
          </div>
        )}
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">BTW 21%</span>
          <span className="text-foreground">{formatEuro(vatAmount)}</span>
        </div>
        <div
          className={`
            mt-1 flex justify-between border-t border-border pt-2 text-base
            font-semibold
          `}
        >
          <span className="text-foreground">Te betalen vandaag</span>
          <span className="text-foreground">{formatEuro(totalGross)}</span>
        </div>
      </div>

      <label
        className={`
          mb-4 flex items-start gap-2 text-[13px] text-foreground-secondary
        `}
      >
        <input
          checked={isConsentChecked}
          className="mt-0.5"
          onChange={onConsentChange}
          type="checkbox"
        />
        Ik ga akkoord met de algemene voorwaarden en geef toestemming voor
        automatische verlenging na 6 maanden (uiterlijk 30 dagen vóór einddatum
        opzegbaar).
      </label>

      {error && <p className="mb-4 text-[13px] text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          className={`
            rounded-md border border-border px-4 py-2.5 text-sm font-semibold
            text-foreground transition
            hover:bg-border-soft
          `}
          onClick={onClose}
          type="button"
        >
          Annuleren
        </button>
        <button
          className={`
            rounded-md bg-primary px-4 py-2.5 text-sm font-semibold
            text-primary-foreground transition
            hover:bg-primary-hover
            disabled:opacity-50
          `}
          disabled={!isConsentChecked || isPending}
          onClick={() => void onSubmit()}
          type="button"
        >
          {isPending ? 'Bezig…' : 'Doorgaan naar betaling'}
        </button>
      </div>
    </ModalShell>
  )
}
