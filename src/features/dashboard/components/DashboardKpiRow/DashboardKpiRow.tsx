import { type FC } from 'react'

import { KpiTile } from '@shared/components/KpiTile'

import { BuyersIcon, ConversationsIcon, ValueIcon } from '../../assets/icons'
import { type Props } from './types'

export const DashboardKpiRow: FC<Props> = ({ counts }) => {
  return (
    <div className="grid-3 mb-5 grid">
      <KpiTile
        icon={<ValueIcon height={18} width={18} />}
        label="Geschatte waarde"
        meta="Nog niet bepaald"
        value="—"
      />
      <KpiTile
        icon={<BuyersIcon height={18} width={18} />}
        label="Geïdentificeerde kopers"
        meta={`${counts.activeConversations} actief in proces`}
        value={String(counts.identifiedBuyers)}
      />
      <KpiTile
        icon={<ConversationsIcon height={18} width={18} />}
        label="Lopende gesprekken"
        meta="Actieve dealflow"
        value={String(counts.activeConversations)}
      />
    </div>
  )
}
