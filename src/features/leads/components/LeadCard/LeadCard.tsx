import { type FC } from 'react'

import {
  AUTO_LEAD_FIT_DEFAULT,
  MANUAL_LEAD_FIT_DEFAULT,
  OSAGO_LEAD_FIT_DEFAULT,
} from '../../constants/leadTypes'
import { buyerDisplayName } from '../../lib/buyerDisplayName'
import { formatLeadDate } from '../../lib/formatLeadDate'
import { LeadCardActions } from '../LeadCardActions'
import { OsagoBadge } from '../OsagoBadge'
import { type Props } from './types'

const FIT_DEFAULTS = {
  auto: AUTO_LEAD_FIT_DEFAULT,
  manual: MANUAL_LEAD_FIT_DEFAULT,
  osago: OSAGO_LEAD_FIT_DEFAULT,
} as const

const FALLBACK_DESCRIPTIONS = {
  auto: 'Automatisch geïdentificeerde potentiële koper op basis van openbare bronnen.',
  manual:
    'Door uzelf toegevoegde lead. Aanvullende details kun je toevoegen via de Details-knop.',
  osago:
    'Lead toegevoegd en gevalideerd door jouw Osago-adviseur. Aanvullende details staan in de detailweergave.',
} as const

const websiteHref = (website: string): string =>
  /^https?:\/\//.test(website) ? website : `https://${website}`

// Shared .buyer-card visual for all three lead sources (ports renderAutoLeadCard
// / renderManualLeadCard / renderOsagoValidatedCard, osago-bundle.js:20633 /
// 20928 / 21104). Since v2 has no `sector` column, "Sector focus" resolves to
// the lead's type — matching legacy's post-Supabase-hydration behaviour.
export const LeadCard: FC<Props> = ({ lead, variant }) => {
  const displayName = buyerDisplayName(lead)
  const fit = lead.fitScore || FIT_DEFAULTS[variant]
  const description = lead.notes?.trim()
    ? lead.notes
    : FALLBACK_DESCRIPTIONS[variant]
  const sectorFocus = lead.type || '—'
  const hasCompanyName = !!(lead.name && lead.name.trim())

  return (
    <div className="buyer-card" data-buyer-type={lead.type ?? ''}>
      <div className="buyer-head">
        <div>
          <div className="buyer-name">{displayName}</div>
          <div className="buyer-type">{lead.type || '—'}</div>
        </div>
        <div className="buyer-fit">{fit}% fit</div>
      </div>

      {variant === 'osago' && (
        <div style={{ margin: '0 0 10px' }}>
          <OsagoBadge lead={lead} />
        </div>
      )}

      <div className="buyer-desc">{description}</div>

      <div className="buyer-meta">
        <div className="bm-row">
          <span className="bm-lbl">Sector focus</span>
          <span className="bm-val">{sectorFocus}</span>
        </div>
        <div className="bm-row">
          <span className="bm-lbl">Locatie</span>
          <span className="bm-val">{lead.location || '—'}</span>
        </div>

        {variant === 'auto' ? (
          <>
            {lead.website && (
              <div className="bm-row">
                <span className="bm-lbl">Website</span>
                <span className="bm-val">
                  <a
                    href={websiteHref(lead.website)}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {lead.website.replace(/^https?:\/\//, '')}
                  </a>
                </span>
              </div>
            )}
            <div className="bm-row">
              <span className="bm-lbl">Bron</span>
              <span className="bm-val">Automatisch (web)</span>
            </div>
          </>
        ) : (
          <>
            {hasCompanyName && (
              <div className="bm-row">
                <span className="bm-lbl">Contact</span>
                <span className="bm-val">{lead.contactLegacy || '—'}</span>
              </div>
            )}
            <div className="bm-row">
              <span className="bm-lbl">Toegevoegd op</span>
              <span className="bm-val">
                {variant === 'osago'
                  ? formatLeadDate(lead.validatedAt ?? lead.addedAt)
                  : formatLeadDate(lead.addedAt)}
              </span>
            </div>
          </>
        )}
      </div>

      <LeadCardActions lead={lead} variant={variant} />
    </div>
  )
}
