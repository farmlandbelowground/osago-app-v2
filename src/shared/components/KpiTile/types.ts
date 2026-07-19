import { type CSSProperties, type ReactNode } from 'react'

export interface Props {
  label: string
  meta: string
  value: string
  icon?: ReactNode
  valueStyle?: CSSProperties
}
