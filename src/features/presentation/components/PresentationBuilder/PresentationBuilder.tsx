import { type FC } from 'react'

import {
  CONTENT_TABS,
  getVisiblePresentationTabs,
} from '../../lib/presentationTabs'
import { PresentationFieldPanel } from '../PresentationFieldPanel'
import { PresentationInhoudPanel } from '../PresentationInhoudPanel'
import { PresentationTabs } from '../PresentationTabs'
import { type PresentationTabItem } from '../PresentationTabs/types'
import { type Props } from './types'

// Ports the tab-bar + panels IIFE of renderPresentationExtended
// (osago-bundle.js:18575-18601). Resolves each field's initial value with the
// legacy valOf rule (stored value wins, else the company prefill) and hands the
// panels to the client tab switcher.
export const PresentationBuilder: FC<Props> = ({ data, prefill }) => {
  const visibleTabs = getVisiblePresentationTabs(data.hiddenTabs)

  const items: PresentationTabItem[] = visibleTabs.map(tab => {
    if (tab.special === 'inhoud') {
      return {
        id: tab.id,
        label: tab.label,
        panel: (
          <PresentationInhoudPanel
            hiddenTabs={data.hiddenTabs}
            includeValuation={data.includeValuation}
            tabs={CONTENT_TABS.map(contentTab => ({
              id: contentTab.id,
              label: contentTab.label,
              required: contentTab.required,
            }))}
          />
        ),
      }
    }

    const initialValues: Record<string, string> = {}
    for (const field of tab.fields) {
      const stored = data.fields[field.key]
      if (stored != null && stored !== '') {
        initialValues[field.key] = stored
      } else if (field.prefill) {
        initialValues[field.key] = prefill[field.prefill] ?? ''
      } else {
        initialValues[field.key] = ''
      }
    }

    return {
      id: tab.id,
      label: tab.label,
      panel: (
        <PresentationFieldPanel
          initialValues={initialValues}
          photos={data.photos[tab.id] ?? []}
          tab={tab}
        />
      ),
    }
  })

  return <PresentationTabs items={items} />
}
