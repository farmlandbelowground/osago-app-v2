export type ToastVariant = 'success' | 'error'

export interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

export interface ToastStore {
  dismissToast: (id: string) => void
  showToast: (message: string, variant?: ToastVariant) => void
  toasts: ToastItem[]
}
