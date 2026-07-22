export interface Props {
  isPending: boolean
  message: string
  onClose: () => void
  onReset: (withInvoice: boolean) => void | Promise<void>
  title: string
}
