'use client'

import { useTransition, type FC } from 'react'

import { useToastStore } from '@shared/store/toast'

import { sendTeaser } from '../../actions'
import { buyerDisplayName } from '../../lib/buyerDisplayName'
import { LeadModalShell } from '../LeadModalShell'
import { type Props } from './types'

export const TeaserModal: FC<Props> = ({ lead, onClose }) => {
  const [isPending, startTransition] = useTransition()
  const showToast = useToastStore(state => state.showToast)

  const contactName =
    [lead.contactFirstName, lead.contactLastName].filter(Boolean).join(' ') ||
    buyerDisplayName(lead)

  const onSend = (): void => {
    startTransition(async () => {
      const result = await sendTeaser(lead.id)
      if (result.error !== null) {
        showToast(result.error, 'error')
        return
      }
      showToast(`Teaser verstuurd naar ${lead.contactEmail ?? ''}`)
      onClose()
    })
  }

  return (
    <LeadModalShell
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Annuleren
          </button>
          <button
            className="btn btn-primary"
            disabled={isPending}
            onClick={onSend}
            type="button"
          >
            {isPending ? 'Bezig...' : 'Verstuur teaser'}
          </button>
        </>
      }
      onClose={onClose}
      title="Teaser sturen naar koper"
    >
      <div className="alert alert-info" style={{ marginBottom: 14 }}>
        <strong>Verzending namens jou (medewerker).</strong> De koper krijgt het
        anoniem verkoopprofiel als PDF-bijlage. Bedrijfsnaam en andere
        identificeerbare gegevens van de verkoper worden hier nog niet gedeeld.
        De standaard teaser-template wordt gebruikt.
      </div>
      <div className="field">
        <label>Aan</label>
        <div
          style={{
            background: 'var(--line-soft)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13.5,
            padding: '9px 12px',
          }}
        >
          <strong>{contactName}</strong> &lt;{lead.contactEmail}&gt;
        </div>
      </div>
    </LeadModalShell>
  )
}
