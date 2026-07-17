import { type PropsWithChildren } from 'react'

export interface CustomProps {
  onClose: () => void
  title: string
  maxWidthClassName?: string
}

export type Props = PropsWithChildren<CustomProps>
