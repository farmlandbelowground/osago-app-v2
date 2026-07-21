import {
  SCORECARD_ANSWER_OPTIONS,
  type ScorecardAnswerOption,
} from '../constants/answerOptions'
import {
  SCORECARD_RATING_NOT_ASSESSED_LABEL,
  SCORECARD_RATING_THRESHOLDS,
} from '../constants/ratingThresholds'
import { type ScorecardAnswerId, type ScorecardState } from '../schema'
import {
  type ScorecardCategory,
  type ScorecardStats,
  type ScorecardTabStats,
} from '../types'

const findAnswerOption = (
  answer: ScorecardAnswerId | undefined,
): ScorecardAnswerOption | undefined =>
  answer === undefined
    ? undefined
    : SCORECARD_ANSWER_OPTIONS.find(option => option.id === answer)

// Scored = answered AND not N.v.t. (`score !== null`); these are the only
// options that count toward any average (osago-bundle.js:7327, 7354).
const isScoredOption = (
  option: ScorecardAnswerOption | undefined,
): option is ScorecardAnswerOption =>
  option !== undefined && option.score !== null

const average = (values: number[]): number | null =>
  values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null

// Verkoopklaar-rating label, checked high → low; the zero-rated edge is
// distinguished from an all-zero rating (osago-bundle.js:7360-7364).
const resolveRatingLabel = (overallPct: number, ratedCount: number): string => {
  if (ratedCount === 0) {
    return SCORECARD_RATING_NOT_ASSESSED_LABEL
  }
  const match = SCORECARD_RATING_THRESHOLDS.find(
    threshold => overallPct >= threshold.min,
  )
  return match ? match.label : SCORECARD_RATING_NOT_ASSESSED_LABEL
}

export const computeScorecardStats = (
  categories: ScorecardCategory[],
  state: ScorecardState,
): ScorecardStats => {
  const tabStats: ScorecardTabStats[] = categories.map(category => {
    const scoredOptions = category.items
      .map(item => findAnswerOption(state[item.id]?.answer))
      .filter(isScoredOption)
    const avg = average(scoredOptions.map(option => option.score ?? 0))
    const pctAvg = average(scoredOptions.map(option => option.percentage ?? 0))
    return {
      answered: category.items.filter(item => state[item.id]?.answer).length,
      avg,
      id: category.id,
      label: category.label,
      pct: pctAvg === null ? 0 : Math.round(pctAvg),
      total: category.items.length,
    }
  })

  const scoredOptions = categories
    .flatMap(category =>
      category.items.map(item => findAnswerOption(state[item.id]?.answer)),
    )
    .filter(isScoredOption)
  const ratedCount = scoredOptions.length
  const overallAvg = average(scoredOptions.map(option => option.score ?? 0))
  const overallPctAvg = average(
    scoredOptions.map(option => option.percentage ?? 0),
  )
  const overallPct = overallPctAvg === null ? 0 : Math.round(overallPctAvg)

  return {
    overallAvg,
    overallLabel: resolveRatingLabel(overallPct, ratedCount),
    overallPct,
    ratedCount,
    tabStats,
    totalAnswered: tabStats.reduce((sum, tab) => sum + tab.answered, 0),
    totalQuestions: categories.reduce(
      (sum, category) => sum + category.items.length,
      0,
    ),
    verbeterCount: scoredOptions.filter(option => option.id !== 'volledig')
      .length,
  }
}
