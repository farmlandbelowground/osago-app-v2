import { type PlanCategory } from '@features/subscriptions/types'

import { type OnboardingStep } from './types'

// Ports legacy's ONBOARDING_STEPS array (osago-bundle.js:3502) — id, label and
// path are the source of truth; each page computes its own isComplete gate.
export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  { id: 'welcome', label: 'Welkom', path: '/welkom-0' },
  { id: 'company', label: 'Bedrijfsprofiel', path: '/welkom-1' },
  { id: 'subscribe', label: 'Start', path: '/welkom-2' },
] as const satisfies readonly OnboardingStep[]

export const WELKOM_PATHS: readonly string[] = ONBOARDING_STEPS.map(
  step => step.path,
)

export const TOTAL_STEPS = ONBOARDING_STEPS.length

export const WELKOM_ROUTE_PREFIX = '/welkom-'

// Ports legacy's renderOnboardingSubscribe() step-4b headline/subtext copy
// (osago-bundle.js:3616-3622), keyed by the intent chosen on step 4a.
export const SUBSCRIBE_INTENT_COPY: Record<
  PlanCategory,
  { headline: string; subtext: string }
> = {
  full: {
    headline: 'Kies jouw verkoopabonnement',
    subtext: 'Volledige begeleiding bij de verkoop van jouw bedrijf.',
  },
  valuation: {
    headline: 'Kies jouw waardebepaling-abonnement',
    subtext:
      'Indicatieve waardering — zonder verkoopbegeleiding of kopermatching.',
  },
}
