import { type FC } from 'react'

import { KpiTile } from '@shared/components/KpiTile'

import { BuyersIcon, ConversationsIcon, ValueIcon } from '../../assets/icons'
import { formatMoney } from '../../lib/formatMoney'
import { type Props } from './types'

export const DashboardKpiRow: FC<Props> = ({
  counts,
  hasWerkruimteAccess,
  valuation,
}) => {
  const valuationLabel = valuation?.useShareholder
    ? 'Aandeelhouderswaarde'
    : 'Ondernemingswaarde'

  return (
    <div className="grid-3 mb-5 grid">
      <KpiTile
        icon={<ValueIcon height={18} width={18} />}
        label="Geschatte waarde"
        meta={
          valuation !== null
            ? `${valuationLabel} · ${formatMoney(valuation.low)} – ${formatMoney(valuation.high)}`
            : 'Nog niet bepaald'
        }
        value={valuation !== null ? formatMoney(valuation.value) : '—'}
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
