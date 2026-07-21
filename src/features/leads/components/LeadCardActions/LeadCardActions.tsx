'use client'

import { useState, useTransition, type FC, type ReactNode } from 'react'

import { useToastStore } from '@shared/store/toast'

import {
  deleteLead,
  promoteAutoLead,
  promoteManualLead,
  promoteOsagoLead,
} from '../../actions'
import { buyerDisplayName } from '../../lib/buyerDisplayName'
import { LeadDetailModal } from '../LeadDetailModal'
import { ManualLeadPromoteModal } from '../ManualLeadPromoteModal'
import { type Props } from './types'

const DISABLED_STYLE = { cursor: 'default', opacity: 0.6 } as const

const TrashIcon: FC = () => (
  <svg
    fill="none"
    height="13"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="13"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
  </svg>
)

export const LeadCardActions: FC<Props> = ({ lead, variant }) => {
  const [isPending, startTransition] = useTransition()
  const [isDetailOpen, setDetailOpen] = useState(false)
  const [isPromoteOpen, setPromoteOpen] = useState(false)
  const showToast = useToastStore(state => state.showToast)

  const displayName = buyerDisplayName(lead)

  const runPromoteAuto = (): void => {
    startTransition(async () => {
      const result = await promoteAutoLead(lead.id)
      if (result.error !== null) {
        showToast(result.error, 'error')
        return
      }
      setDetailOpen(false)
      showToast(
        `${displayName} toegevoegd aan "Handmatig toegevoegde leads". Rond daar de pipeline-stap af.`,
      )
    })
  }

  const runPromoteOsago = (): void => {
    startTransition(async () => {
      const result = await promoteOsagoLead(lead.id)
      if (result.error !== null) {
        showToast(result.error, 'error')
        return
      }
      setDetailOpen(false)
      showToast(`${displayName} toegevoegd aan het Verkoopproces.`)
    })
  }

  const runManualSelf = (): void => {
    startTransition(async () => {
      const result = await promoteManualLead(lead.id, 'self')
      if (result.error !== null) {
        showToast(result.error, 'error')
        return
      }
      setPromoteOpen(false)
      showToast(`${displayName} toegevoegd aan het Verkoopproces.`)
    })
  }

  const runManualValidation = (): void => {
    startTransition(async () => {
      const result = await promoteManualLead(lead.id, 'validation')
      if (result.error !== null) {
        showToast(result.error, 'error')
        return
      }
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl
      }
    })
  }

  const runDelete = (): void => {
    if (variant === 'manual') {
      const extra = lead.promotedToPipeline
        ? '\n\nDeze lead staat al in jouw Verkoopproces. Hij verdwijnt alleen uit dit overzicht — de pipeline-kopie blijft staan tot je die zelf verwijdert.'
        : ''
      if (
        !window.confirm(
          `Weet je zeker dat je "${displayName}" wilt verwijderen?${extra}`,
        )
      ) {
        return
      }
    }
    startTransition(async () => {
      const result = await deleteLead(lead.id)
      if (result.error !== null) {
        showToast(result.error, 'error')
        return
      }
      setDetailOpen(false)
      showToast('Lead verwijderd.')
    })
  }

  const openPromoteFromDetail = (): void => {
    setDetailOpen(false)
    setPromoteOpen(true)
  }

  const primaryButton = ((): ReactNode => {
    if (variant === 'auto') {
      return lead.promotedToPipeline ? (
        <button
          className="btn btn-secondary btn-sm"
          disabled
          style={DISABLED_STYLE}
          type="button"
        >
          ✓ Toegevoegd
        </button>
      ) : (
        <button
          className="btn btn-primary btn-sm"
          disabled={isPending}
          onClick={runPromoteAuto}
          type="button"
        >
          + Toevoegen aan leads
        </button>
      )
    }

    if (variant === 'osago') {
      return lead.promotedToPipeline ? (
        <button
          className="btn btn-secondary btn-sm"
          disabled
          style={DISABLED_STYLE}
          type="button"
        >
          ✓ In pipeline
        </button>
      ) : (
        <button
          className="btn btn-primary btn-sm"
          disabled={isPending}
          onClick={runPromoteOsago}
          type="button"
        >
          + Toevoegen aan pipeline
        </button>
      )
    }

    if (lead.validationStatus === 'pending_validation') {
      return (
        <button
          className="btn btn-secondary btn-sm"
          disabled
          style={DISABLED_STYLE}
          title="Wachten op validatie door Osago"
          type="button"
        >
          ⏳ Validatie aangevraagd
        </button>
      )
    }
    return lead.promotedToPipeline ? (
      <button
        className="btn btn-secondary btn-sm"
        disabled
        style={DISABLED_STYLE}
        type="button"
      >
        ✓ In pipeline
      </button>
    ) : (
      <button
        className="btn btn-primary btn-sm"
        onClick={() => setPromoteOpen(true)}
        type="button"
      >
        + Toevoegen aan pipeline
      </button>
    )
  })()

  const detailFooter = ((): ReactNode => {
    if (variant === 'auto') {
      return (
        <>
          <div style={{ flex: 1 }} />
          <button
            className="btn btn-secondary"
            onClick={() => setDetailOpen(false)}
            type="button"
          >
            Sluiten
          </button>
          {lead.promotedToPipeline ? (
            <button
              className="btn btn-secondary"
              disabled
              style={DISABLED_STYLE}
              type="button"
            >
              ✓ Toegevoegd
            </button>
          ) : (
            <button
              className="btn btn-primary"
              disabled={isPending}
              onClick={runPromoteAuto}
              type="button"
            >
              + Toevoegen aan leads
            </button>
          )}
        </>
      )
    }

    if (variant === 'osago') {
      return (
        <>
          <div style={{ flex: 1 }} />
          <button
            className="btn btn-secondary"
            onClick={() => setDetailOpen(false)}
            type="button"
          >
            Sluiten
          </button>
          {lead.promotedToPipeline ? (
            <button
              className="btn btn-secondary"
              disabled
              style={DISABLED_STYLE}
              type="button"
            >
              ✓ In pipeline
            </button>
          ) : (
            <button
              className="btn btn-primary"
              disabled={isPending}
              onClick={runPromoteOsago}
              type="button"
            >
              + Toevoegen aan pipeline
            </button>
          )}
        </>
      )
    }

    return (
      <>
        <button className="btn btn-danger" onClick={runDelete} type="button">
          Verwijderen
        </button>
        <div style={{ flex: 1 }} />
        <button
          className="btn btn-secondary"
          onClick={() => setDetailOpen(false)}
          type="button"
        >
          Sluiten
        </button>
        {lead.validationStatus === 'pending_validation' ? (
          <button
            className="btn btn-secondary"
            disabled
            style={DISABLED_STYLE}
            type="button"
          >
            ⏳ Validatie aangevraagd
          </button>
        ) : lead.promotedToPipeline ? (
          <button
            className="btn btn-secondary"
            disabled
            style={DISABLED_STYLE}
            type="button"
          >
            ✓ In pipeline
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={openPromoteFromDetail}
            type="button"
          >
            + Toevoegen aan pipeline
          </button>
        )}
      </>
    )
  })()

  return (
    <>
      <div className="buyer-actions">
        {primaryButton}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setDetailOpen(true)}
          type="button"
        >
          Details
        </button>
        {variant !== 'osago' && (
          <button
            className="btn btn-ghost btn-sm"
            disabled={isPending}
            onClick={runDelete}
            style={{ color: 'var(--muted)' }}
            title="Verwijderen"
            type="button"
          >
            <TrashIcon />
          </button>
        )}
      </div>

      {isDetailOpen && (
        <LeadDetailModal
          footer={detailFooter}
          lead={lead}
          onClose={() => setDetailOpen(false)}
          variant={variant}
        />
      )}

      {isPromoteOpen && (
        <ManualLeadPromoteModal
          isPending={isPending}
          onClose={() => setPromoteOpen(false)}
          onSelfAdd={runManualSelf}
          onValidation={runManualValidation}
        />
      )}
    </>
  )
}
