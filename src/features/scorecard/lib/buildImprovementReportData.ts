import {
  SCORECARD_IMPROVEMENT_PRIORITIES,
  SCORECARD_IMPROVEMENT_PRIORITY_ORDER,
} from '../constants/answerOptions'
import { type ScorecardAnswerId, type ScorecardState } from '../schema'
import {
  type ScorecardCategory,
  type ScorecardImprovementCategory,
  type ScorecardImprovementPoint,
  type ScorecardImprovementPriorityId,
  type ScorecardImprovementReportData,
} from '../types'
import { computeScorecardStats } from './computeScorecardStats'

const isImprovementPriorityId = (
  answer: ScorecardAnswerId | undefined,
): answer is ScorecardImprovementPriorityId =>
  answer !== undefined && answer in SCORECARD_IMPROVEMENT_PRIORITIES

const countByAnswer = (
  categories: ScorecardImprovementCategory[],
  answer: ScorecardImprovementPriorityId,
): number =>
  categories
    .flatMap(category => category.points)
    .filter(point => point.answer === answer).length

// The pure data-shaping half of legacy's verbeterrapport (osago-bundle.js:
// 7687-7734): the prioritised per-category action-point tree plus the cover
// summary numbers. Answers of `volledig`/`nvt`/unanswered are excluded; points
// are sorted Hoog → Middel → Laag within each category. The jsPDF drawing
// (:7736-7887) is the deferred imperative half (Slice 13). Summary figures are
// taken from computeScorecardStats so the cover matches the KPI row exactly.
export const buildImprovementReportData = (
  categories: ScorecardCategory[],
  state: ScorecardState,
): ScorecardImprovementReportData => {
  const stats = computeScorecardStats(categories, state)

  const improvementCategories: ScorecardImprovementCategory[] = categories
    .map(category => {
      const points: ScorecardImprovementPoint[] = category.items
        .map(item => ({
          answer: state[item.id]?.answer,
          item,
          notes: state[item.id]?.notes ?? '',
        }))
        .filter((point): point is ScorecardImprovementPoint =>
          isImprovementPriorityId(point.answer),
        )
        .sort(
          (a, b) =>
            SCORECARD_IMPROVEMENT_PRIORITY_ORDER.indexOf(a.answer) -
            SCORECARD_IMPROVEMENT_PRIORITY_ORDER.indexOf(b.answer),
        )
      return { category: { id: category.id, label: category.label }, points }
    })
    .filter(entry => entry.points.length > 0)

  return {
    categories: improvementCategories,
    hoogCount: countByAnswer(improvementCategories, 'niet'),
    laagCount: countByAnswer(improvementCategories, 'grotendeels'),
    middelCount: countByAnswer(improvementCategories, 'gedeeltelijk'),
    overallLabel: stats.overallLabel,
    overallPct: stats.overallPct,
    totalAnswered: stats.ratedCount,
    totalPoints: improvementCategories.reduce(
      (sum, entry) => sum + entry.points.length,
      0,
    ),
    totalQuestions: stats.totalQuestions,
  }
}
