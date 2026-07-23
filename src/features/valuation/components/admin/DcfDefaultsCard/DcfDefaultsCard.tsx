'use client'

import { useRouter } from 'next/navigation'
import { useState, type FC, type ReactNode } from 'react'

import { useToastStore } from '@shared/store/toast'

import { saveDcfAdminDefaults } from '../../../actions'
import {
  DCF_ADMIN_DECIMAL_MAX,
  PERCENT_DECIMALS,
  PERCENT_DIVISOR,
} from '../../../constants/valuationAdmin'
import { type Props } from './types'

const toPercentString = (decimal: number): string =>
  Number.isFinite(decimal)
    ? (decimal * PERCENT_DIVISOR).toFixed(PERCENT_DECIMALS).replace('.', ',')
    : ''

const parsePercentToDecimal = (raw: string): number | null => {
  const normalized = raw
    .replace(',', '.')
    .replace(/[^\d.-]/g, '')
    .trim()
  const value = parseFloat(normalized)

  if (normalized === '' || !Number.isFinite(value)) {
    return null
  }

  const decimal = value / PERCENT_DIVISOR

  if (decimal < 0 || decimal > DCF_ADMIN_DECIMAL_MAX) {
    return null
  }

  return decimal
}

export const DcfDefaultsCard: FC<Props> = ({ defaults }) => {
  const router = useRouter()
  const showToast = useToastStore(state => state.showToast)
  const [rfr, setRfr] = useState(toPercentString(defaults.rfr))
  const [mrp, setMrp] = useState(toPercentString(defaults.mrp))
  const [liquiditeitspremie, setLiquiditeitspremie] = useState(
    toPercentString(defaults.liquiditeitspremie),
  )
  const [isPending, setIsPending] = useState(false)

  const onSave = async (): Promise<void> => {
    const parsedRfr = parsePercentToDecimal(rfr)
    const parsedMrp = parsePercentToDecimal(mrp)
    const parsedLiq = parsePercentToDecimal(liquiditeitspremie)

    if (parsedRfr === null || parsedMrp === null || parsedLiq === null) {
      showToast(
        'Gebruik een percentage tussen 0 en 100 voor alle velden.',
        'error',
      )
      return
    }

    setIsPending(true)
    const result = await saveDcfAdminDefaults({
      liquiditeitspremie: parsedLiq,
      mrp: parsedMrp,
      rfr: parsedRfr,
    })
    setIsPending(false)

    if (result.error) {
      showToast(result.error, 'error')
      return
    }

    showToast('DCF-aannames bijgewerkt.')
    router.refresh()
  }

  const field = (
    label: string,
    value: string,
    onChange: (next: string) => void,
  ): ReactNode => (
    <>
      <label style={{ color: 'var(--ink)', fontSize: 14 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          autoComplete="off"
          inputMode="decimal"
          onChange={event => onChange(event.target.value)}
          style={{
            border: '1px solid var(--line)',
            borderRadius: 6,
            fontVariantNumeric: 'tabular-nums',
            padding: '8px 28px 8px 12px',
            textAlign: 'right',
            width: '100%',
          }}
          type="text"
          value={value}
        />
        <span
          style={{
            color: 'var(--muted)',
            pointerEvents: 'none',
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          %
        </span>
      </div>
    </>
  )

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div
        style={{
          alignItems: 'flex-start',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <h2 className="form-section-title" style={{ margin: 0 }}>
            DCF-aannames
          </h2>
          <p
            className="form-section-desc"
            style={{ margin: '6px 0 0', maxWidth: 640 }}
          >
            Standaardwaarden voor Risk free rate, Market risk premium en
            Sectorcorrectie op het DCF-werkscherm. Klanten kunnen ze daar
            individueel overschrijven; deze waarden worden gebruikt als
            startpositie en bij &quot;Reset naar defaults&quot;.
          </p>
        </div>
        <button
          className="btn btn-primary"
          disabled={isPending}
          onClick={() => void onSave()}
          type="button"
        >
          Wijzigingen opslaan
        </button>
      </div>

      <div
        style={{
          alignItems: 'center',
          display: 'grid',
          gap: 14,
          gridTemplateColumns: '1fr 200px',
          maxWidth: 640,
        }}
      >
        {field('Risk free rate', rfr, setRfr)}
        {field('Market risk premium', mrp, setMrp)}
        {field('Liquiditeitspremie', liquiditeitspremie, setLiquiditeitspremie)}
      </div>
      <p
        className="text-xs text-muted"
        style={{ lineHeight: 1.5, marginTop: 14, maxWidth: 640 }}
      >
        De sectoropslag wordt per sector ingesteld in de Multiples-tabel
        hieronder — deze wordt op de DCF-pagina automatisch ingevuld op basis
        van de op Mijn bedrijf gekozen sector.
      </p>
    </div>
  )
}
