import { type PropsWithChildren, type ReactNode } from 'react'

export interface CustomProps {
  onClose: () => void
  title: string
  footer?: ReactNode
  maxWidthClassName?: string
}

export type Props = PropsWithChildren<CustomProps>
