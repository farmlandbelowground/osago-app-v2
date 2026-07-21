import { type ReactNode } from 'react'

export interface Props {
  autoPanel: ReactNode
  manualPanel: ReactNode
  osagoPanel: ReactNode
}

export type BuyerTab = 'auto' | 'manual' | 'osago'
