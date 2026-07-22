import { useMemo, useState } from 'react'

import { useToastStore } from '@shared/store/toast'

import { saveScorecardAnswer } from '../../actions'
import { computeScorecardStats } from '../../lib/computeScorecardStats'
import { type ScorecardAnswerId, type ScorecardState } from '../../schema'
import { type UseScorecard, type UseScorecardParams } from './types'

// Optimistic local state — each slider/nvt change updates state immediately and
// fires saveScorecardAnswer (per-change persistence, osago-bundle.js:7549-7597);
// stats recompute reactively (no full re-render as legacy did).
export const useScorecard = ({
  categories,
  initialState,
}: UseScorecardParams): UseScorecard => {
  const showToast = useToastStore(state => state.showToast)
  const [state, setState] = useState<ScorecardState>(initialState)

  const stats = useMemo(
    () => computeScorecardStats(categories, state),
    [categories, state],
  )

  const setAnswer = (
    questionId: string,
    answer: ScorecardAnswerId | null,
  ): void => {
    setState(current => {
      const existing = current[questionId] ?? {}

      if (answer === null) {
        const { answer: _cleared, ...rest } = existing
        return { ...current, [questionId]: rest }
      }

      return { ...current, [questionId]: { ...existing, answer } }
    })

    void saveScorecardAnswer(questionId, answer).then(result => {
      if (result.error) {
        showToast(result.error, 'error')
      }
    })
  }

  return { setAnswer, state, stats }
}
