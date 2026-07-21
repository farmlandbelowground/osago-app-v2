'use client'

import { useState, type FC, type ReactNode } from 'react'

import { cn } from '@shared/utils/cn'

import { type BuyerTab, type Props } from './types'

const TABS: readonly { id: BuyerTab; label: string }[] = [
  { id: 'auto', label: 'Automatisch geïdentificeerde leads' },
  { id: 'osago', label: 'Gevalideerde leads door Osago' },
  { id: 'manual', label: 'Handmatig toegevoegde leads' },
]

// Ports renderBuyersV2's tab strip + bindBuyersV2 (osago-bundle.js:20568-20583,
// 21370-21390): three lead-source tabs, client-side show/hide, no refetch. The
// three RSC panels are passed in as slots so switching never re-fetches.
export const BuyerMatchingTabs: FC<Props> = ({
  autoPanel,
  manualPanel,
  osagoPanel,
}) => {
  const [activeTab, setActiveTab] = useState<BuyerTab>('auto')

  const panels: Record<BuyerTab, ReactNode> = {
    auto: autoPanel,
    manual: manualPanel,
    osago: osagoPanel,
  }

  return (
    <>
      <div className="tabs">
        {TABS.map(tab => (
          <div
            className={cn('tab', activeTab === tab.id && 'active')}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {TABS.map(tab => (
        <div
          key={tab.id}
          style={{ display: activeTab === tab.id ? undefined : 'none' }}
        >
          {panels[tab.id]}
        </div>
      ))}
    </>
  )
}
