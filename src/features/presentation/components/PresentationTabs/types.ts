import { type ReactNode } from 'react'

export interface PresentationTabItem {
  id: string
  label: string
  panel: ReactNode
}

export interface Props {
  items: PresentationTabItem[]
}
