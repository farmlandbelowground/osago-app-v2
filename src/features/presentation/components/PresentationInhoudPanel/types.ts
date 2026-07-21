export interface InhoudTabRow {
  id: string
  label: string
  required: boolean
}

export interface Props {
  hiddenTabs: string[]
  includeValuation: boolean
  tabs: InhoudTabRow[]
}
