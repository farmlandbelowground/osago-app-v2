import { type ScorecardTabStats } from '../../types'

export interface Props {
  activeTabId: string
  onSelect: (id: string) => void
  tabs: ScorecardTabStats[]
}
