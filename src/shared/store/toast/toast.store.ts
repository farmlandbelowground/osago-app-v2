import { create } from 'zustand'

import { TOAST_DURATION_MS } from './constants'
import { type ToastStore } from './types'

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  showToast: (message, variant = 'success') => {
    const id = crypto.randomUUID()

    set(state => ({ toasts: [...state.toasts, { id, message, variant }] }))
    setTimeout(() => get().dismissToast(id), TOAST_DURATION_MS)
  },
  dismissToast: id =>
    set(state => ({ toasts: state.toasts.filter(toast => toast.id !== id) })),
}))
