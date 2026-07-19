import { type FC } from 'react'

import { type Props } from './types'

export const KpiTile: FC<Props> = ({ label, meta, value, valueStyle }) => {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={valueStyle}>
        {value}
      </div>
      <div className="stat-meta">{meta}</div>
    </div>
  )
}
