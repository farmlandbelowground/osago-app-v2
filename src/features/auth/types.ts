export type TwoFactorStepName = 'phone-required' | 'twofa'

export type AuthFlowState =
  | { error: string; status: 'error' }
  | { status: 'idle' }
  | { error?: string; status: 'phone-required' }
  | { phoneMasked: string | null; status: 'twofa' }

export type VerifyCodeState =
  | { error: string; status: 'error' }
  | { status: 'idle' }

export type ForgotPasswordState =
  | { error: string; status: 'error' }
  | { status: 'idle' }
  | { status: 'sent' }

export type VerifyEmailState =
  | { error: string; status: 'error' }
  | { message: string; status: 'unavailable' }
  | { status: 'idle' }
