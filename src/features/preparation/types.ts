export type PreparationGroupId = 'bedrijf' | 'waardering' | 'presentatie'

export type PreparationScreenId =
  | 'financiele-gegevens'
  | 'mijn-bedrijf'
  | 'presentatie'
  | 'value-drivers'
  | 'waardebepaling'
  | 'waarderingsrapport'

export type ScreenStatus = 'current' | 'done' | 'locked'

export interface ScreenState {
  group: PreparationGroupId
  id: PreparationScreenId
  label: string
  path: string
  status: ScreenStatus
}

export interface GroupSummary {
  done: number
  id: PreparationGroupId
  label: string
  stepNumber: number
  total: number
}

export interface PreparationState {
  completedCount: number
  currentScreen: ScreenState | null
  groups: GroupSummary[]
  isComplete: boolean
  screens: ScreenState[]
  totalCount: number
}
