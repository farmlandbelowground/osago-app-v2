'use client'

import { useState, type FC } from 'react'

import { SubscribePlanGrid } from '@features/subscriptions'
import { cn } from '@shared/utils/cn'

import { CONVERSION_FOOTNOTE, USPS } from './constants'
import { type Props } from './types'

// Conversion dashboard shown when the customer has no active subscription
// (docx §2). Two tabs — full plans vs valuation-only — plus a dark-green
// USP panel at the bottom. Plan clicks fall through to the existing
// /abonnement-afsluiten?plan=<id> flow (SubscribePlanGrid does that
// linking); no separate purchase flow is built here.

type TabId = 'valuation' | 'verkoop'

export const ConversionDashboard: FC<Props> = ({ firstName }) => {
  const [tab, setTab] = useState<TabId>('verkoop')

  return (
    <main className="main">
      <h1 className="page-title">Welkom{firstName ? `, ${firstName}` : ''}.</h1>

      <div className="conversion-tabs">
        <button
          className={cn('conversion-tab', tab === 'verkoop' && 'active')}
          onClick={() => setTab('verkoop')}
          type="button"
        >
          Verkoopabonnementen
        </button>
        <button
          className={cn('conversion-tab', tab === 'valuation' && 'active')}
          onClick={() => setTab('valuation')}
          type="button"
        >
          Alleen waardebepaling
        </button>
      </div>

      {tab === 'verkoop' ? (
        <SubscribePlanGrid category="full" />
      ) : (
        <SubscribePlanGrid category="valuation" />
      )}

      <div className="usp-panel">
        <h3>Waarom ondernemers voor Osago kiezen</h3>
        <p className="usp-sub">
          Alles wat je nodig hebt om je bedrijf te verkopen, op één plek.
        </p>
        <div className="usp-grid">
          {USPS.map(usp => (
            <div className="usp" key={usp.title}>
              <div className="usp-ic">{usp.icon}</div>
              <div>
                <div className="usp-t">{usp.title}</div>
                <div className="usp-d">{usp.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="conversion-footnote">{CONVERSION_FOOTNOTE}</p>
    </main>
  )
}
