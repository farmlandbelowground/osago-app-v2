import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import { PROGRESS_STEPS } from './constants'
import { type Props } from './types'

export const ValuationProgressTracker: FC<Props> = ({ progress }) => {
  const doneCount = PROGRESS_STEPS.filter(
    step => progress[step.progressKey],
  ).length

  return (
    <div className="mb-4">
      <p className="text-sm text-muted mb-2">
        {doneCount} / {PROGRESS_STEPS.length} stappen voltooid
      </p>
      <div className="steps">
        {PROGRESS_STEPS.map((step, index) => {
          const isDone = progress[step.progressKey]

          return (
            <div className={cn('step', isDone && 'done')} key={step.label}>
              <span className="step-num">{isDone ? '✓' : index + 1}</span>
              {step.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
