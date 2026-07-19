import { type FC } from 'react'

import { Logo } from '@shared/components/Logo'

import { exitOnboarding } from '../../actions'
import { ONBOARDING_STEPS } from '../../constants'
import { OnboardingFooterNav } from '../OnboardingFooterNav'
import { OnboardingProgressBar } from '../OnboardingProgressBar'
import { type Props } from './types'

const HelpIcon: FC = () => (
  <svg
    fill="none"
    height="16"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="16"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" x2="12.01" y1="17" y2="17" />
  </svg>
)

const CloseIcon: FC = () => (
  <svg
    fill="none"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="16"
  >
    <line x1="18" x2="6" y1="6" y2="18" />
    <line x1="6" x2="18" y1="6" y2="18" />
  </svg>
)

export const OnboardingShell: FC<Props> = ({
  children,
  completeHint,
  isStepComplete,
  stepIndex,
}) => {
  const prevPath = stepIndex > 0 ? ONBOARDING_STEPS[stepIndex - 1].path : null
  const nextPath =
    stepIndex < ONBOARDING_STEPS.length - 1
      ? ONBOARDING_STEPS[stepIndex + 1].path
      : null

  return (
    <div className="ob-shell">
      <div className="ob-topbar">
        <div className="ob-topbar-logo">
          <Logo />
        </div>
        <OnboardingProgressBar stepIndex={stepIndex} />
        <button
          aria-label="Hulp nodig? Start chat"
          className="help-btn"
          title="Hulp nodig? Start chat"
          type="button"
        >
          <HelpIcon />
        </button>
        <form action={exitOnboarding}>
          <button
            aria-label="Sluit onboarding"
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px 8px' }}
            title="Sluit de onboarding en ga naar het dashboard"
            type="submit"
          >
            <CloseIcon />
          </button>
        </form>
      </div>

      <div className="ob-body">
        <div className="ob-content">{children}</div>
      </div>

      <OnboardingFooterNav
        completeHint={completeHint}
        isStepComplete={isStepComplete}
        nextPath={nextPath}
        prevPath={prevPath}
        stepIndex={stepIndex}
      />
    </div>
  )
}
