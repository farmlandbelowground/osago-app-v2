'use client'

import { useEffect, useState, type FC } from 'react'

import { MoneyInput } from '@shared/components/MoneyInput'
import { useToastStore } from '@shared/store/toast'

import { saveValuationBand } from '../../actions'
import { useValuationBandStore } from '../../store'
import { type Props } from './types'

// Ports the "Bandbreedte" card (osago-bundle.js:15058-15071) plus the input
// wiring from bindValuation (:15743-15757) and saveShareholderValueInputs
// (:16490-16501) — which, on this page, persists the band and nothing else.
export const ValuationBandCard: FC<Props> = ({ initialBand }) => {
  const [value, setValue] = useState<number | null>(initialBand)
  const [isPending, setIsPending] = useState(false)
  const setBand = useValuationBandStore(state => state.setBand)
  const showToast = useToastStore(state => state.showToast)

  // Hand control back to the server value when leaving the page, so a stale
  // in-progress edit cannot outlive this render.
  useEffect(() => () => setBand(null), [setBand])

  const onChange = (next: number | null): void => {
    setValue(next)
    setBand(next ?? 0)
  }

  const onSave = async (): Promise<void> => {
    setIsPending(true)
    const result = await saveValuationBand(value ?? 0)
    setIsPending(false)

    if (result.error !== null) {
      showToast(result.error, 'error')
      return
    }

    // No router.refresh() and no store reset: legacy's saveShareholderValueInputs
    // (osago-bundle.js:16490-16501) only toasts, leaving the typed value on the
    // sliders until the next full page load.
    showToast('Bandbreedte opgeslagen.')
  }

  return (
    <div className="card">
      <h3>Bandbreedte</h3>
      <p className="desc">
        Pas de bandbreedte aan; deze wordt direct toegepast op de
        &quot;Indicatieve ondernemingswaarde&quot; en &quot;Indicatieve
        aandeelhouderswaarde&quot; sliders bovenaan de pagina.
      </p>
      <div
        style={{
          alignItems: 'flex-end',
          display: 'flex',
          gap: '12px',
          marginTop: '18px',
        }}
      >
        <div
          className="field"
          style={{ flex: 1, marginBottom: 0, maxWidth: '240px' }}
        >
          <label>Bandbreedte</label>
          <MoneyInput onChange={onChange} value={value} />
        </div>
        <button
          className="btn btn-primary"
          disabled={isPending}
          onClick={() => void onSave()}
          type="button"
        >
          Opslaan
        </button>
      </div>
    </div>
  )
}
