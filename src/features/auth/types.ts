export type TwoFactorStepName = 'phone-required' | 'twofa'

export type AuthFlowState =
  | { error: string; status: 'error' }
  | { status: 'idle' }
  | { error?: string; status: 'phone-required' }
  | { phoneMasked: string | null; status: 'twofa' }

export type VerifyCodeState =
  { error: string; status: 'error' } | { status: 'idle' }

export type ForgotPasswordState =
  { error: string; status: 'error' } | { status: 'idle' } | { status: 'sent' }

export type VerifyEmailState =
  | { error: string; status: 'error' }
  | { message: string; status: 'unavailable' }
  | { status: 'idle' }

export type UpdatePersonalInfoState =
  | { error: string; success: false }
  | { emailConfirmationSent?: boolean; success: true }

export interface AccountProfile {
  createdAt: string
  email: string
  firstName: string | null
  id: string
  lastName: string | null
  partnerVoucherCode: string | null
  phone: string | null
  photo: string | null
  referredByPartnerId: string | null
}
