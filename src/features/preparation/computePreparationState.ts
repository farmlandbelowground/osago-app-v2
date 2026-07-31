import { PREPARATION_GROUPS, PREPARATION_SCREENS } from './constants'
import {
  type GroupSummary,
  type PreparationGroupId,
  type PreparationScreenId,
  type PreparationState,
  type ScreenState,
} from './types'

export type ScreenDoneFlags = Record<PreparationScreenId, boolean>

export interface ComputeOptions {
  // Restrict the journey to these groups only. Valuation-only accounts
  // (no werkruimte-access) pass a set without 'presentatie' so Step 3 is
  // dropped from the sidebar + dashboard progress (docx §0: "only the
  // valuation screens, no Step 3 and no sales"). Omit for the full journey.
  includeGroups?: ReadonlySet<PreparationGroupId>
}

// Pure aggregator: takes per-screen done-flags and returns the full
// PreparationState. The first non-done screen (in journey order) becomes
// "current"; everything after it is "locked". When `includeGroups` is
// passed, screens outside those groups are dropped entirely.
export const computePreparationState = (
  flags: ScreenDoneFlags,
  options: ComputeOptions = {},
): PreparationState => {
  const activeScreens = options.includeGroups
    ? PREPARATION_SCREENS.filter(s => options.includeGroups!.has(s.group))
    : PREPARATION_SCREENS
  const activeGroups = options.includeGroups
    ? PREPARATION_GROUPS.filter(g => options.includeGroups!.has(g.id))
    : PREPARATION_GROUPS

  let currentAssigned = false
  const screens: ScreenState[] = activeScreens.map(def => {
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

  const groups: GroupSummary[] = activeGroups.map(group => {
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
    isComplete: totalCount > 0 && completedCount === totalCount,
    screens,
    totalCount,
  }
}
