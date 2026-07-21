'use client'

import { useRouter } from 'next/navigation'
import { useState, type FC } from 'react'

import { useToastStore } from '@shared/store/toast'

import {
  togglePresentationIncludeValuation,
  togglePresentationTab,
} from '../../actions'
import { type InhoudTabRow, type Props } from './types'

const LockIcon: FC = () => (
  <svg
    fill="none"
    height="14"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="14"
  >
    <rect height="11" rx="2" width="18" x="3" y="11" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const rowStyle = {
  alignItems: 'center',
  display: 'flex',
  gap: 14,
  padding: '12px 0',
} as const

const labelStyle = { color: 'var(--ink)', fontSize: 14 } as const

// Ports renderPresExtInhoudPanel (osago-bundle.js:18946-18994): one visibility
// toggle per non-inhoud tab (required tabs show a lock instead), the valuation
// opt-in, and a save button. Toggling a tab persists + refreshes so the tab bar
// updates (legacy re-rendered the page); the valuation opt-in is stored-but-
// unread (OQ-3). The "Opslaan" button is a pure confirmation toast, as legacy.
export const PresentationInhoudPanel: FC<Props> = ({
  hiddenTabs,
  includeValuation,
  tabs,
}) => {
  const router = useRouter()
  const showToast = useToastStore(state => state.showToast)
  const [includeValuationChecked, setIncludeValuationChecked] =
    useState(includeValuation)

  const onToggleTab = async (
    tabId: string,
    visible: boolean,
  ): Promise<void> => {
    const result = await togglePresentationTab(tabId, visible)
    if (result.error !== null) {
      showToast(result.error, 'error')
      return
    }
    router.refresh()
  }

  const onToggleValuation = async (checked: boolean): Promise<void> => {
    setIncludeValuationChecked(checked)
    const result = await togglePresentationIncludeValuation(checked)
    if (result.error !== null) {
      setIncludeValuationChecked(!checked)
      showToast(result.error, 'error')
    }
  }

  const renderTabRow = (tab: InhoudTabRow): React.ReactNode => {
    if (tab.required) {
      return (
        <div key={tab.id} style={rowStyle}>
          <div
            style={{
              color: 'var(--muted)',
              display: 'flex',
              justifyContent: 'center',
              width: 36,
            }}
          >
            <LockIcon />
          </div>
          <span style={labelStyle}>{tab.label}</span>
        </div>
      )
    }

    return (
      <div key={tab.id} style={rowStyle}>
        <label className="toggle-switch" style={{ margin: 0 }}>
          <input
            checked={!hiddenTabs.includes(tab.id)}
            onChange={event => void onToggleTab(tab.id, event.target.checked)}
            type="checkbox"
          />
          <span className="toggle-track" />
        </label>
        <span style={labelStyle}>{tab.label}</span>
      </div>
    )
  }

  return (
    <div className="card mb-5">
      <div className="form-section" style={{ marginBottom: 0 }}>
        <h3 className="form-section-title">Inhoud</h3>
        <div style={{ marginTop: 12 }}>{tabs.map(renderTabRow)}</div>
      </div>

      <div className="form-section" style={{ marginBottom: 0, marginTop: 24 }}>
        <h3 className="form-section-title">Extra inhoud in het memorandum</h3>
        <div style={{ ...rowStyle, marginTop: 6 }}>
          <label className="toggle-switch" style={{ margin: 0 }}>
            <input
              checked={includeValuationChecked}
              onChange={event => void onToggleValuation(event.target.checked)}
              type="checkbox"
            />
            <span className="toggle-track" />
          </label>
          <span style={labelStyle}>
            Beknopte informatie over de waardebepaling toevoegen aan het
            informatiememorandum
          </span>
        </div>
      </div>

      <div
        style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}
      >
        <button
          className="btn btn-primary"
          onClick={() => showToast('Wijzigingen opgeslagen.')}
          type="button"
        >
          Opslaan
        </button>
      </div>
    </div>
  )
}
