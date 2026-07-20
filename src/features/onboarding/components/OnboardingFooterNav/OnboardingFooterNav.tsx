'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FC } from 'react'

import { useToastStore } from '@shared/store/toast'

import { completeOnboarding } from '../../actions'
import { TOTAL_STEPS } from '../../constants'
import { DEFAULT_COMPLETE_HINT } from './constants'
import { type Props } from './types'

const ArrowLeftIcon: FC = () => (
  <svg
    fill="none"
    height="13"
    stroke="currentColor"
    strokeWidth="2"
    style={{ verticalAlign: -2, marginRight: 4 }}
    viewBox="0 0 24 24"
    width="13"
  >
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

const ArrowRightIcon: FC = () => (
  <svg
    fill="none"
    height="13"
    stroke="currentColor"
    strokeWidth="2"
    style={{ verticalAlign: -2, marginLeft: 4 }}
    viewBox="0 0 24 24"
    width="13"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

export const OnboardingFooterNav: FC<Props> = ({
  completeHint,
  isStepComplete,
  nextPath,
  prevPath,
  stepIndex,
}) => {
  const router = useRouter()
  const showToast = useToastStore(state => state.showToast)
  const [isPending, setIsPending] = useState(false)
  const isLastStep = nextPath === null

  const onAdvance = async (): Promise<void> => {
    if (!isStepComplete) {
      showToast(completeHint ?? DEFAULT_COMPLETE_HINT, 'error')
      return
    }

    if (isLastStep) {
      setIsPending(true)
      await completeOnboarding()
      return
    }

    router.push(nextPath)
  }

  return (
    <div className="ob-footer">
      <div>
        {prevPath && (
          <Link className="btn btn-secondary" href={prevPath}>
            <ArrowLeftIcon />
            Vorige
          </Link>
        )}
      </div>
      <div className="ob-footer-actions">
        <span className="ob-step-counter">
          Stap {stepIndex + 1} van {TOTAL_STEPS}
        </span>
        <button
          className="btn btn-primary"
          disabled={isPending}
          onClick={() => void onAdvance()}
          type="button"
        >
          {isLastStep ? 'Onboarding voltooien' : 'Volgende'}
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  )
}
