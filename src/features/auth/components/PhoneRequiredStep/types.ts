export interface Props {
  formAction: (formData: FormData) => void
  isPending: boolean
  onCancel: () => void
  phoneError: string | null
}
