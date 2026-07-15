export interface Props {
  formAction: (formData: FormData) => void
  isPending: boolean
  isResending: boolean
  onCancel: () => void
  onResend: () => void
  phoneMasked: string | null
  resendError: string | null
  verifyError: string | null
}
