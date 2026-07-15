import { type AuthFlowState, type TwoFactorStepName, type VerifyCodeState } from '../../types'

export interface Args {
  flowState: AuthFlowState
}

export interface Result {
  isResending: boolean
  isSavingPhone: boolean
  isVerifying: boolean
  onCancel: () => void
  onResend: () => void
  phoneError: string | null
  phoneFormAction: (formData: FormData) => void
  phoneMasked: string | null
  resendError: string | null
  step: TwoFactorStepName
  verifyFormAction: (formData: FormData) => void
  verifyState: VerifyCodeState
}

export type UseTwoFactorFlow = (args: Args) => Result
