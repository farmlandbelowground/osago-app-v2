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

export const SubscribeConfirmModal: FC<Props> = ({
  basePath = ABONNEMENT_AFSLUITEN_PATH,
  plan,
}) => {
  const router = useRouter()
  const [stage, setStage] = useState<'confirm' | 'payment'>('confirm')
  const [voucher, setVoucher] = useState<AppliedVoucher | null>(null)
  const [isConsentChecked, setIsConsentChecked] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onClose = (): void => {
    router.push(basePath)
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
    <ModalShell
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Annuleren
          </button>
          {stage === 'confirm' ? (
            <button
              className="btn btn-primary"
              disabled={!isConsentChecked}
              onClick={() => setStage('payment')}
              type="button"
            >
              Doorgaan naar betaling
            </button>
          ) : (
            <button
              className="btn btn-primary"
              disabled={isPending}
              onClick={() => void onSubmit()}
              type="button"
            >
              {isPending ? 'Bezig…' : 'Doorgaan naar betaling'}
            </button>
          )}
        </>
      }
      onClose={onClose}
      title={stage === 'confirm' ? 'Abonnement bevestigen' : 'Betaling — abonnement activeren'}
    >
      {stage === 'confirm' ? (
        <>
          <p className="mb-4 text-sm text-muted">
            Je staat op het punt het volgende abonnement te activeren:
          </p>

          <div className="plan-summary">
            <div className="plan-summary-left">
              <strong>{plan.label}</strong>
              <span className="text-muted">{plan.desc}</span>
            </div>
            <div className="plan-summary-right">
              <strong>{formatEuro(plan.price)}</strong>
              {plan.category === 'full' && (
                <span className="text-muted">per 6 maanden</span>
              )}
            </div>
          </div>

          {plan.category === 'full' && (
            <div
              style={{
                display: 'grid',
                fontSize: 13,
                gap: 14,
                gridTemplateColumns: '1fr 1fr',
                marginBottom: 18,
              }}
            >
              <div>
                <div
                  className="text-muted"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    marginBottom: 3,
                    textTransform: 'uppercase',
                  }}
                >
                  Startdatum
                </div>
                <div>
                  <strong>{formatDateNl(startDate.toISOString())}</strong> (vandaag)
                </div>
              </div>
              <div>
                <div
                  className="text-muted"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    marginBottom: 3,
                    textTransform: 'uppercase',
                  }}
                >
                  Einddatum
                </div>
                <div>
                  <strong>{formatDateNl(endDate.toISOString())}</strong> (
                  {SUBSCRIPTION_DURATION_MONTHS} maanden)
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
            className="mb-4 text-sm"
            style={{
              background: '#FAFBFA',
              border: '1px solid var(--line-soft)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
            }}
          >
            <div className="flex-between text-sm text-muted">
              <span>Subtotaal (excl. BTW)</span>
              <span>{formatEuro(plan.price)}</span>
            </div>
            {voucher && (
              <div
                className="flex-between text-sm"
                style={{ color: 'var(--green-dark)', marginTop: 4 }}
              >
                <span>Korting ({voucher.code})</span>
                <span>−{formatEuro(discount)}</span>
              </div>
            )}
            <div
              className="flex-between text-sm text-muted"
              style={{ marginTop: 4 }}
            >
              <span>BTW 21%</span>
              <span>{formatEuro(vatAmount)}</span>
            </div>
            <div
              className="flex-between"
              style={{
                marginTop: 8,
                paddingTop: 8,
                borderTop: '1px solid var(--line)',
              }}
            >
              <strong>Te betalen vandaag</strong>
              <strong style={{ fontSize: 16 }}>{formatEuro(totalGross)}</strong>
            </div>
          </div>

          <label
            className="gap-2 mb-4 text-sm flex"
            style={{ alignItems: 'flex-start' }}
          >
            <input
              checked={isConsentChecked}
              onChange={onConsentChange}
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
            Ik ga akkoord met de algemene voorwaarden en geef toestemming voor
            automatische verlenging na 6 maanden (uiterlijk 30 dagen vóór
            einddatum opzegbaar).
          </label>
        </>
      ) : (
        <>
          <div style={{ marginBottom: 18 }}>
            <div className="text-muted text-sm" style={{ marginBottom: 6 }}>
              Je betaalt voor
            </div>
            <div
              className="serif"
              style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.01em' }}
            >
              Osago {plan.label}
            </div>
            <div className="text-muted text-sm" style={{ marginTop: 2 }}>
              Eerste {SUBSCRIPTION_DURATION_MONTHS} maanden:{' '}
              {formatDateNl(startDate.toISOString())} t/m{' '}
              {formatDateNl(endDate.toISOString())}
            </div>
          </div>

          <div
            className="card"
            style={{ background: '#FAFBFA', marginBottom: 18, padding: 16 }}
          >
            {voucher ? (
              <>
                <div
                  className="flex-between"
                  style={{ fontSize: 13, marginBottom: 6 }}
                >
                  <span className="text-muted">Subtotaal</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatEuro(plan.price)}
                  </span>
                </div>
                <div
                  className="flex-between"
                  style={{ color: 'var(--green-dark)', fontSize: 13, marginBottom: 8 }}
                >
                  <span>Vouchercode {voucher.code}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    −{formatEuro(discount)}
                  </span>
                </div>
                <div
                  className="flex-between"
                  style={{
                    borderTop: '1px solid var(--line)',
                    marginBottom: 8,
                    paddingTop: 8,
                  }}
                >
                  <strong>Te betalen</strong>
                  <strong style={{ fontSize: 18, fontVariantNumeric: 'tabular-nums' }}>
                    {formatEuro(netAfterDiscount)}
                  </strong>
                </div>
              </>
            ) : (
              <div className="flex-between" style={{ marginBottom: 8 }}>
                <span className="text-muted text-sm">Bedrag</span>
                <strong style={{ fontSize: 18, fontVariantNumeric: 'tabular-nums' }}>
                  {formatEuro(plan.price)}
                </strong>
              </div>
            )}
            <div className="flex-between">
              <span className="text-muted text-sm">Looptijd</span>
              <span className="text-sm">
                {SUBSCRIPTION_DURATION_MONTHS} maanden · automatisch verlengen
                aan
              </span>
            </div>
          </div>

          <p className="text-muted text-xs" style={{ lineHeight: 1.5, marginTop: 18 }}>
            Je wordt doorgestuurd naar de beveiligde betaalpagina. Jouw
            abonnement wordt automatisch geactiveerd zodra de betaling is
            bevestigd.
          </p>
        </>
      )}

      {error && <div className="alert alert-error mb-4 text-sm">{error}</div>}
    </ModalShell>
  )
}
