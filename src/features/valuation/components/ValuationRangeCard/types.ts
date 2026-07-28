import { type ReactNode } from 'react'

export interface Props {
  // ± offset applied to `mid` to derive the low/high labels.
  band: number
  idSuffix: string
  mid: number
  title: string
  // Rendered inside the card, below the slider (the DCF totals table).
  children?: ReactNode
  // Follow the Bandbreedte card's live value while the customer types. Legacy
  // does this for the enterprise/shareholder sliders but not the DCF card
  // (updateShareholderValueLive, osago-bundle.js:16471-16487).
  isLive?: boolean
}
