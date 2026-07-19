import { Fragment, type FC } from 'react'

import { cn } from '@shared/utils/cn'

import { ONBOARDING_STEPS } from '../../constants'
import { type Props } from './types'

const CheckIcon: FC = () => (
  <svg
    fill="none"
    height="13"
    stroke="currentColor"
    strokeWidth="3"
    viewBox="0 0 24 24"
    width="13"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export const OnboardingProgressBar: FC<Props> = ({ stepIndex }) => (
  <div className="ob-progress">
    {ONBOARDING_STEPS.map((step, index) => {
      const isDone = index < stepIndex
      const isCurrent = index === stepIndex
      const showConnector = index < ONBOARDING_STEPS.length - 1

      return (
        <Fragment key={step.id}>
          <div className={cn('ob-step', isDone && 'done', isCurrent && 'current')}>
            <div className="ob-step-circle">{isDone ? <CheckIcon /> : index + 1}</div>
            <div className="ob-step-label">{step.label}</div>
          </div>
          {showConnector && (
            <div className={cn('ob-step-connector', isDone && 'done')} />
          )}
        </Fragment>
      )
    })}
  </div>
)
