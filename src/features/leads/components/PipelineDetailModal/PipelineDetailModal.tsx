'use client'

import { useState, useTransition, type FC } from 'react'

import { useToastStore } from '@shared/store/toast'

import { deleteLead, updatePipelineLead } from '../../actions'
import { COUNTRIES } from '../../constants/countries'
import { FIT_SCORE_MAX, LEAD_STAGES } from '../../constants/stages'
import { buyerDisplayName } from '../../lib/buyerDisplayName'
import { formatLeadDate } from '../../lib/formatLeadDate'
import { type Lead, type LeadStage, type PipelineLeadInput } from '../../types'
import { LeadModalShell } from '../LeadModalShell'
import { OsagoBadge } from '../OsagoBadge'
import { SalesDocButtons } from '../SalesDocButtons'
import { TeaserModal } from '../TeaserModal'
import { ValidationUpdateModal } from '../ValidationUpdateModal'
import { type Props } from './types'

// Backwards-compat: split a legacy combined contact into first/last
// (osago-bundle.js:21655-21661).
const initialContact = (lead: Lead): { first: string; last: string } => {
  if (lead.contactFirstName || lead.contactLastName) {
    return {
      first: lead.contactFirstName ?? '',
      last: lead.contactLastName ?? '',
    }
  }
  const parts = (lead.contactLegacy ?? '').trim().split(/\s+/).filter(Boolean)
  return { first: parts[0] ?? '', last: parts.slice(1).join(' ') }
}

export const PipelineDetailModal: FC<Props> = ({
  companyHasName,
  isMedewerker,
  lead,
  onClose,
}) => {
  const contact = initialContact(lead)
  const [medewerkerModal, setMedewerkerModal] = useState<
    'teaser' | 'validation' | null
  >(null)
  const [stage, setStage] = useState<LeadStage>(lead.stage ?? 'new')
  const [fitScore, setFitScore] = useState(String(lead.fitScore ?? 0))
  const [contactFirstName, setContactFirstName] = useState(contact.first)
  const [contactLastName, setContactLastName] = useState(contact.last)
  const [contactEmail, setContactEmail] = useState(lead.contactEmail ?? '')
  const [contactPhone, setContactPhone] = useState(lead.contactPhone ?? '')
  const [street, setStreet] = useState(lead.street ?? '')
  const [houseNumber, setHouseNumber] = useState(lead.houseNumber ?? '')
  const [houseNumberAddition, setHouseNumberAddition] = useState(
    lead.houseNumberAddition ?? '',
  )
  const [postalCode, setPostalCode] = useState(lead.postalCode ?? '')
  const [city, setCity] = useState(
    lead.city ?? (lead.location ?? '').split(',')[0].trim(),
  )
  const [country, setCountry] = useState(lead.country ?? 'Nederland')
  const [notes, setNotes] = useState(lead.notes ?? '')

  const [isPending, startTransition] = useTransition()
  const showToast = useToastStore(state => state.showToast)

  const buildInput = (): PipelineLeadInput => ({
    city,
    contactEmail,
    contactFirstName,
    contactLastName,
    contactPhone,
    country,
    fitScore: Number(fitScore),
    houseNumber,
    houseNumberAddition,
    notes,
    postalCode,
    stage,
    street,
  })

  const persistEdits = async (): Promise<boolean> => {
    const result = await updatePipelineLead(lead.id, buildInput())
    return result.error === null
  }

  const onSave = (): void => {
    startTransition(async () => {
      const result = await updatePipelineLead(lead.id, buildInput())
      if (result.error !== null) {
        showToast(result.error, 'error')
        return
      }
      showToast('Wijzigingen opgeslagen.')
      onClose()
    })
  }

  const onDelete = (): void => {
    if (
      !window.confirm(
        'Weet je zeker dat je deze koper uit de pipeline wilt verwijderen?',
      )
    ) {
      return
    }
    startTransition(async () => {
      const result = await deleteLead(lead.id)
      if (result.error !== null) {
        showToast(result.error, 'error')
        return
      }
      showToast('Koper verwijderd.')
      onClose()
    })
  }

  return (
    <>
      <LeadModalShell
        footer={
          <>
            <button className="btn btn-danger" onClick={onDelete} type="button">
              Verwijderen
            </button>
            <div style={{ flex: 1 }} />
            <button
              className="btn btn-secondary"
              onClick={onClose}
              type="button"
            >
              Annuleren
            </button>
            <button
              className="btn btn-primary"
              disabled={isPending}
              onClick={onSave}
              type="button"
            >
              {isPending ? 'Bezig...' : 'Opslaan'}
            </button>
          </>
        }
        maxWidthClassName="modal-lg"
        onClose={onClose}
        title={buyerDisplayName(lead)}
      >
        <div
          className="flex-between mb-4"
          style={{ flexWrap: 'wrap', gap: '12px' }}
        >
          <div className="text-muted text-sm">
            {lead.type} · Toegevoegd {formatLeadDate(lead.addedAt)}
          </div>
          {lead.validatedByOsago && <OsagoBadge lead={lead} size="lg" />}
        </div>

        <div className="form-row">
          <div className="field">
            <label>Fase in proces</label>
            <select
              onChange={event => setStage(event.target.value as LeadStage)}
              value={stage}
            >
              {LEAD_STAGES.map(definition => (
                <option key={definition.id} value={definition.id}>
                  {definition.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Fit-score</label>
            <input
              max={FIT_SCORE_MAX}
              min={0}
              onChange={event => setFitScore(event.target.value)}
              type="number"
              value={fitScore}
            />
          </div>
        </div>

        <div className="form-section" style={{ marginBottom: '18px' }}>
          <h3
            className="form-section-title"
            style={{ fontSize: '15px', paddingTop: '8px' }}
          >
            Contactpersoon
          </h3>
          <div className="form-row">
            <div className="field">
              <label>Voornaam</label>
              <input
                onChange={event => setContactFirstName(event.target.value)}
                value={contactFirstName}
              />
            </div>
            <div className="field">
              <label>Achternaam</label>
              <input
                onChange={event => setContactLastName(event.target.value)}
                value={contactLastName}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>E-mailadres</label>
              <input
                onChange={event => setContactEmail(event.target.value)}
                type="email"
                value={contactEmail}
              />
            </div>
            <div className="field">
              <label>Telefoonnummer</label>
              <input
                onChange={event => setContactPhone(event.target.value)}
                type="tel"
                value={contactPhone}
              />
            </div>
          </div>
        </div>

        <div className="form-section" style={{ marginBottom: '18px' }}>
          <h3
            className="form-section-title"
            style={{ fontSize: '15px', paddingTop: '8px' }}
          >
            Adres
          </h3>
          <div
            style={{
              display: 'grid',
              gap: '14px',
              gridTemplateColumns: '2fr 1fr 1fr',
            }}
          >
            <div className="field">
              <label>Straatnaam</label>
              <input
                onChange={event => setStreet(event.target.value)}
                value={street}
              />
            </div>
            <div className="field">
              <label>Huisnummer</label>
              <input
                onChange={event => setHouseNumber(event.target.value)}
                value={houseNumber}
              />
            </div>
            <div className="field">
              <label>Toevoeging</label>
              <input
                onChange={event => setHouseNumberAddition(event.target.value)}
                value={houseNumberAddition}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Postcode</label>
              <input
                onChange={event => setPostalCode(event.target.value)}
                value={postalCode}
              />
            </div>
            <div className="field">
              <label>Plaats</label>
              <input
                onChange={event => setCity(event.target.value)}
                value={city}
              />
            </div>
          </div>
          <div className="field">
            <label>Land</label>
            <select
              onChange={event => setCountry(event.target.value)}
              value={country}
            >
              {COUNTRIES.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Notities &amp; verslag</label>
          <textarea
            onChange={event => setNotes(event.target.value)}
            placeholder="Documenteer interactiemomenten, beslissingen, follow-ups..."
            rows={5}
            value={notes}
          />
        </div>

        <div className="divider" />

        <h3
          className="form-section-title"
          style={{ fontSize: '15px', marginBottom: '8px', paddingTop: 0 }}
        >
          Documenten
        </h3>
        <SalesDocButtons
          hasCompanyName={companyHasName}
          leadId={lead.id}
          persistEdits={persistEdits}
          stage={stage}
        />

        {isMedewerker && (
          <>
            <div className="divider" />
            <h3
              className="form-section-title"
              style={{ fontSize: '15px', marginBottom: '8px', paddingTop: 0 }}
            >
              Medewerker
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                className="btn btn-secondary btn-medewerker"
                onClick={() => setMedewerkerModal('teaser')}
                type="button"
              >
                Teaser sturen
              </button>
              <button
                className="btn btn-secondary btn-medewerker"
                onClick={() => setMedewerkerModal('validation')}
                type="button"
              >
                Validatie-update sturen
              </button>
            </div>
          </>
        )}
      </LeadModalShell>
      {medewerkerModal === 'teaser' && (
        <TeaserModal lead={lead} onClose={() => setMedewerkerModal(null)} />
      )}
      {medewerkerModal === 'validation' && (
        <ValidationUpdateModal
          lead={lead}
          onClose={() => setMedewerkerModal(null)}
        />
      )}
    </>
  )
}
