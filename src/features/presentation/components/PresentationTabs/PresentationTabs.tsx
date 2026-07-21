'use client'

import { useState, type FC } from 'react'

import { type Props } from './types'

// Ports the tab bar + panel show/hide of bindPresentationExtended
// (osago-bundle.js:18608-18620). All panels stay mounted; only display toggles,
// so field/photo state persists across tab switches with no refetch.
export const PresentationTabs: FC<Props> = ({ items }) => {
  const [activeId, setActiveId] = useState(items[0]?.id ?? '')

  const effectiveActiveId = items.some(item => item.id === activeId)
    ? activeId
    : (items[0]?.id ?? '')

  return (
    <>
      <div className="tabs" data-scope="pres-ext" style={{ flexWrap: 'wrap' }}>
        {items.map(item => (
          <div
            className={item.id === effectiveActiveId ? 'tab active' : 'tab'}
            key={item.id}
            onClick={() => setActiveId(item.id)}
          >
            {item.label}
          </div>
        ))}
      </div>
      {items.map(item => (
        <div
          key={item.id}
          style={
            item.id === effectiveActiveId ? undefined : { display: 'none' }
          }
        >
          {item.panel}
        </div>
      ))}
    </>
  )
}
