import { PREPARATION_GROUPS, PREPARATION_SCREENS } from './constants'
import {
  type GroupSummary,
  type PreparationScreenId,
  type PreparationState,
  type ScreenState,
} from './types'

export type ScreenDoneFlags = Record<PreparationScreenId, boolean>

// Pure aggregator: takes per-screen done-flags and returns the full
// PreparationState. The first non-done screen (in journey order) becomes
// "current"; everything after it is "locked".
export const computePreparationState = (
  flags: ScreenDoneFlags,
): PreparationState => {
  let currentAssigned = false
  const screens: ScreenState[] = PREPARATION_SCREENS.map(def => {
    const done = flags[def.id]
    let status: ScreenState['status']
    if (done) {
      status = 'done'
    } else if (!currentAssigned) {
      status = 'current'
      currentAssigned = true
    } else {
      status = 'locked'
    }
    return { ...def, status }
  })

  const groups: GroupSummary[] = PREPARATION_GROUPS.map(group => {
    const groupScreens = screens.filter(s => s.group === group.id)
    return {
      done: groupScreens.filter(s => s.status === 'done').length,
      id: group.id,
      label: group.label,
      stepNumber: group.stepNumber,
      total: groupScreens.length,
    }
  })

  const completedCount = screens.filter(s => s.status === 'done').length
  const totalCount = screens.length
  const currentScreen = screens.find(s => s.status === 'current') ?? null

  return {
    completedCount,
    currentScreen,
    groups,
    isComplete: completedCount === totalCount,
    screens,
    totalCount,
  }
}
