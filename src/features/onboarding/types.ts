export type OnboardingStepId = 'welcome' | 'company' | 'subscribe'

export interface OnboardingStep {
  id: OnboardingStepId
  label: string
  path: string
}
