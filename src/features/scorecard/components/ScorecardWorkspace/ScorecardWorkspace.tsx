'use client'

import { useMemo, useState, type FC } from 'react'

import { TAKE5_SCORECARD } from '../../constants/questions'
import { useScorecard } from '../../hooks/useScorecard'
import { getFilteredScorecard } from '../../lib/getFilteredScorecard'
import { ScorecardCategoryPanel } from '../ScorecardCategoryPanel'
import { ScorecardKpiRow } from '../ScorecardKpiRow'
import { ScorecardReportButton } from '../ScorecardReportButton'
import { ScorecardResetButton } from '../ScorecardResetButton'
import { ScorecardTabStrip } from '../ScorecardTabStrip'
import { type Props } from './types'

export const ScorecardWorkspace: FC<Props> = ({
  company,
  initialState,
  reportInVault,
}) => {
  const categories = useMemo(() => getFilteredScorecard(company), [company])
  const { setAnswer, state, stats } = useScorecard({
    categories,
    initialState,
  })
  const [activeTabId, setActiveTabId] = useState(categories[0]?.id ?? '')

  const activeCategory =
    categories.find(category => category.id === activeTabId) ?? categories[0]

  const totalAvailable = TAKE5_SCORECARD.length
  const tabsHidden = totalAvailable - categories.length
  const allItemsTotal = TAKE5_SCORECARD.reduce(
    (sum, category) => sum + category.items.length,
    0,
  )
  const visibleItemsTotal = categories.reduce(
    (sum, category) => sum + category.items.length,
    0,
  )
  const itemsHidden = allItemsTotal - visibleItemsTotal

  if (!activeCategory) {
    return (
      <>
        <div className="page-header">
          <div>
            <h1 className="page-title">Verkoopklaar maken</h1>
          </div>
        </div>
        <div className="card">
          <div className="empty">
            <h3>Geen relevante vragen</h3>
            <p>
              Voor deze sector en bedrijfsgrootte zijn op dit moment geen
              scorecard-vragen beschikbaar.
            </p>
          </div>
        </div>
      </>
    )
  }

  const activeStats =
    stats.tabStats.find(tab => tab.id === activeCategory.id) ??
    stats.tabStats[0]
  const startIndex = categories
    .slice(0, categories.indexOf(activeCategory))
    .reduce((sum, category) => sum + category.items.length, 0)

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Verkoopklaar maken</h1>
        </div>
        <div
          className="page-actions"
          style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 10 }}
        >
          {reportInVault && <ScorecardResetButton />}
          <ScorecardReportButton
            categories={categories}
            companyName={company.name ?? ''}
            reportInVault={reportInVault}
            sector={company.sector}
            state={state}
            verbeterCount={stats.verbeterCount}
          />
          <span
            className="badge badge-green"
            style={{ fontSize: 11, letterSpacing: '0.05em' }}
          >
            MEDEWERKER
          </span>
        </div>
      </div>

      <ScorecardKpiRow stats={stats} />

      {(tabsHidden > 0 || itemsHidden > 0) && (
        <div
          className="alert alert-info"
          style={{ fontSize: 12.5, marginBottom: 14 }}
        >
          <strong>Slim gefilterd:</strong>{' '}
          {tabsHidden > 0 && (
            <span>
              {tabsHidden} tab{tabsHidden === 1 ? '' : 's'} verborgen
            </span>
          )}
          {tabsHidden > 0 && itemsHidden > 0 ? ' · ' : ''}
          {itemsHidden > 0 && (
            <span>
              {itemsHidden} losse vra{itemsHidden === 1 ? 'ag' : 'gen'} verborgen
            </span>
          )}{' '}
          — niet relevant voor sector <em>{company.sector || '—'}</em>.
        </div>
      )}

      <ScorecardTabStrip
        activeTabId={activeCategory.id}
        onSelect={setActiveTabId}
        tabs={stats.tabStats}
      />

      {activeStats && (
        <ScorecardCategoryPanel
          activeStats={activeStats}
          category={activeCategory}
          onAnswer={setAnswer}
          startIndex={startIndex}
          state={state}
        />
      )}

      <div
        className="card mb-5"
        style={{ background: 'var(--green-soft)', border: '1px solid var(--green)' }}
      >
        <h3 style={{ margin: '0 0 4px' }}>Werkwijze</h3>
        <p className="desc" style={{ marginBottom: 0 }}>
          Antwoorden worden direct opgeslagen op het klantprofiel — er is geen
          aparte opslaan-knop. De scorecard is alleen zichtbaar voor
          Osago-medewerkers, niet voor de klant.
        </p>
      </div>
    </>
  )
}
