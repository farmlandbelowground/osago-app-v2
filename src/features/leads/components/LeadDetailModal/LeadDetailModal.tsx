'use client'

import { type FC } from 'react'

import {
  AUTO_LEAD_FIT_DEFAULT,
  MANUAL_LEAD_FIT_DEFAULT,
  OSAGO_LEAD_FIT_DEFAULT,
} from '../../constants/leadTypes'
import { buyerDisplayName } from '../../lib/buyerDisplayName'
import { formatLeadDate } from '../../lib/formatLeadDate'
import { LeadModalShell } from '../LeadModalShell'
import { OsagoBadge } from '../OsagoBadge'
import { type Props } from './types'

const fullAddress = (lead: Props['lead']): string =>
  [
    [lead.street, lead.houseNumber, lead.houseNumberAddition]
      .filter(Boolean)
      .join(' '),
    [lead.postalCode, lead.city].filter(Boolean).join(' '),
    lead.country,
  ]
    .filter(Boolean)
    .join(', ') || '—'

const websiteHref = (website: string): string =>
  /^https?:\/\//.test(website) ? website : `https://${website}`

// Read-only detail modals per source (osago-bundle.js:20825/20996/21274).
export const LeadDetailModal: FC<Props> = ({
  footer,
  lead,
  onClose,
  variant,
}) => {
  const fullName =
    [lead.contactFirstName, lead.contactLastName].filter(Boolean).join(' ') ||
    '—'

  if (variant === 'auto') {
    const fit = lead.fitScore || AUTO_LEAD_FIT_DEFAULT
    return (
      <LeadModalShell
        footer={footer}
        onClose={onClose}
        title={buyerDisplayName(lead)}
      >
        <div className="form-section" style={{ marginBottom: '18px' }}>
          <h3 className="form-section-title" style={{ fontSize: '14px' }}>
            Potentiële koper
          </h3>
          <div className="form-row">
            <div className="field">
              <label>Naam</label>
              <div>
                {lead.name ? lead.name : <span className="text-muted">—</span>}
              </div>
            </div>
            <div className="field">
              <label>Type</label>
              <div>{lead.type || '—'}</div>
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Fit-score</label>
              <div>{fit}%</div>
            </div>
            <div className="field">
              <label>Locatie</label>
              <div>{lead.location || '—'}</div>
            </div>
          </div>
          {lead.website && (
            <div className="form-row">
              <div className="field">
                <label>Website</label>
                <div>
                  <a
                    href={websiteHref(lead.website)}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {lead.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
        {lead.notes && (
          <div className="form-section">
            <h3 className="form-section-title" style={{ fontSize: '14px' }}>
              Waarom een mogelijke koper
            </h3>
            <p style={{ lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
              {lead.notes}
            </p>
          </div>
        )}
        <div
          className="alert alert-info"
          style={{ fontSize: '13px', marginTop: '16px' }}
        >
          Deze lead is automatisch geïdentificeerd uit openbare bronnen en nog{' '}
          <strong>niet gevalideerd</strong>. Voeg hem toe aan je leads om
          interesse te (laten) peilen voordat hij in de actieve pipeline komt.
        </div>
      </LeadModalShell>
    )
  }

  const fit =
    lead.fitScore ||
    (variant === 'osago' ? OSAGO_LEAD_FIT_DEFAULT : MANUAL_LEAD_FIT_DEFAULT)
  const addedOn =
    variant === 'osago'
      ? formatLeadDate(lead.validatedAt ?? lead.addedAt)
      : formatLeadDate(lead.addedAt)

  return (
    <LeadModalShell
      footer={footer}
      onClose={onClose}
      title={buyerDisplayName(lead)}
    >
      {variant === 'osago' && lead.validatedByOsago && (
        <div style={{ marginBottom: '14px' }}>
          <OsagoBadge lead={lead} size="lg" />
        </div>
      )}
      {variant === 'manual' &&
        lead.validationStatus === 'pending_validation' && (
          <div className="alert alert-info" style={{ marginBottom: '18px' }}>
            <strong>
              Validatie door Osago aangevraagd
              {lead.validationPaidAt
                ? ` op ${formatLeadDate(lead.validationPaidAt)}`
                : ''}
              .
            </strong>{' '}
            Een Osago-medewerker controleert de partij en neemt contact op.
            Zodra de validatie is afgerond verschijnt de lead automatisch in
            jouw Verkoopproces.
          </div>
        )}

      <div className="form-section" style={{ marginBottom: '18px' }}>
        <h3 className="form-section-title" style={{ fontSize: '14px' }}>
          Koper / partij
        </h3>
        <div className="form-row">
          <div className="field">
            <label>Bedrijfsnaam</label>
            <div>
              {lead.name && lead.name.trim() ? (
                lead.name
              ) : (
                <span className="text-muted">— (geen bedrijf)</span>
              )}
            </div>
          </div>
          <div className="field">
            <label>Type</label>
            <div>{lead.type || '—'}</div>
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Fit-score</label>
            <div>{fit}%</div>
          </div>
          <div className="field">
            <label>Toegevoegd op</label>
            <div>{addedOn}</div>
          </div>
        </div>
      </div>

      <div className="form-section" style={{ marginBottom: '18px' }}>
        <h3 className="form-section-title" style={{ fontSize: '14px' }}>
          Contactpersoon
        </h3>
        <div className="form-row">
          <div className="field">
            <label>Naam</label>
            <div>{fullName}</div>
          </div>
          <div className="field">
            <label>E-mail</label>
            <div>{lead.contactEmail || '—'}</div>
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Telefoon</label>
            <div>{lead.contactPhone || '—'}</div>
          </div>
          <div className="field">
            <label>Adres</label>
            <div>{fullAddress(lead)}</div>
          </div>
        </div>
      </div>

      {lead.notes && (
        <div className="form-section">
          <h3 className="form-section-title" style={{ fontSize: '14px' }}>
            {variant === 'osago' ? 'Notities van Osago' : 'Notities'}
          </h3>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{lead.notes}</p>
        </div>
      )}
    </LeadModalShell>
  )
}
