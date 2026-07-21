import { type FC } from 'react'

import { KpiTile } from '@shared/components/KpiTile'

import { BuyersIcon, ConversationsIcon, ValueIcon } from '../../assets/icons'
import { type Props } from './types'

export const DashboardKpiRow: FC<Props> = ({
  counts,
  estimatedValue,
  hasWerkruimteAccess,
}) => {
  return (
    <div className="grid-3 mb-5 grid">
      <KpiTile
        icon={<ValueIcon height={18} width={18} />}
        label="Geschatte waarde"
        meta={
          estimatedValue !== null ? 'Indicatieve waarde' : 'Nog niet bepaald'
        }
        value={
          estimatedValue !== null
            ? `€ ${Math.round(estimatedValue).toLocaleString('nl-NL')}`
            : '—'
        }
      />
      <KpiTile
        icon={<BuyersIcon height={18} width={18} />}
        label="Geïdentificeerde kopers"
        meta={
          hasWerkruimteAccess
            ? `${counts.activeConversations} actief in proces`
            : 'Werkruimte-abonnement vereist'
        }
        value={
          hasWerkruimteAccess ? String(counts.identifiedBuyers) : 'Geen toegang'
        }
      />
      <KpiTile
        icon={<ConversationsIcon height={18} width={18} />}
        label="Lopende gesprekken"
        meta={
          hasWerkruimteAccess
            ? 'Actieve dealflow'
            : 'Werkruimte-abonnement vereist'
        }
        value={
          hasWerkruimteAccess
            ? String(counts.activeConversations)
            : 'Geen toegang'
        }
      />
    </div>
  )
}
