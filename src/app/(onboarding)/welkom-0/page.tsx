import { OnboardingShell, OnboardingWelcomeStep } from '@features/onboarding'

export default function Welkom0Page() {
  return (
    <OnboardingShell isStepComplete stepIndex={0}>
      <OnboardingWelcomeStep />
    </OnboardingShell>
  )
}
