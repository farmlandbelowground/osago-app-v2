import {
  VALUE_DRIVERS,
  VD_PERCENTAGE_SLIDER_MAX,
  VD_PERCENTAGE_SLIDER_MIN,
  VD_SECTIONS,
  VD_SCORING,
} from '../constants/valueDrivers'
import { type ValueDriverAnswers, type ValueDriverSectionScore } from '../types'

const scoreAnswer = (
  vdId: `q${number}`,
  rawValue: number | undefined,
): number | null => {
  if (rawValue === undefined) {
    return null
  }
  const config = VD_SCORING[vdId]
  if (!config) {
    return null
  }

  if (config.kind === 'percentage_slider') {
    const clamped = Math.max(
      VD_PERCENTAGE_SLIDER_MIN,
      Math.min(VD_PERCENTAGE_SLIDER_MAX, rawValue),
    )
    return config.direction === 'lowGood'
      ? VD_PERCENTAGE_SLIDER_MAX - clamped
      : clamped
  }

  const definition = VALUE_DRIVERS.find(driver => driver.id === vdId)
  const stops = definition?.labels?.length ?? null
  if (!stops || stops < 2) {
    return null
  }
  const clamped = Math.max(0, Math.min(stops - 1, rawValue))
  const fraction = clamped / (stops - 1)
  return config.direction === 'inverted'
    ? (1 - fraction) * VD_PERCENTAGE_SLIDER_MAX
    : fraction * VD_PERCENTAGE_SLIDER_MAX
}

export const computeValueDriverSectionScores = (
  answers: ValueDriverAnswers,
): ValueDriverSectionScore[] =>
  VD_SECTIONS.map(section => {
    const scores: number[] = []
    for (const id of section.ids) {
      const score = scoreAnswer(id, answers[id])
      if (score !== null) {
        scores.push(score)
      }
    }
    const average =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null

    return {
      title: section.title,
      score: average === null ? null : Math.round(average),
      answeredCount: scores.length,
      totalCount: section.ids.length,
    }
  })
