'use client'

import { useTransition, type FC, type ReactNode } from 'react'

import { useToastStore } from '@shared/store/toast'

import {
  refreshIdentityStatus,
  startIdentityVerification,
} from '../../actions'
import { type IdentityStatus } from '../../types'
import { type Props } from './types'

// Stripe Identity verification card.
//
// Statuses (docx §5): not_started / in_review / verified / rejected. The
// component is prop-driven — the parent (RSC page) fetches the profile via
// getIdentityStatus and passes it in. Server actions handle start + refresh.
//
// `variant`:
//   - "account" (default): stand-alone card between Personal details and
//     Password on /account.
//   - "dashboard": for §4's blocking state on the dashboard (mounted in
//     Fase 2). Same content, no visual difference in Fase 1.
//
// Start-flow: server action creates the Stripe VerificationSession, marks
// the profile in_review, and returns the hosted URL. We open that in the
// same tab (Stripe recommends redirect for hosted flow — a new tab breaks
// their return_url handoff on mobile).

const formatDate = (iso: string | null): string => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const formatDateTime = (iso: string | null): string => {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}, ${d.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

const STATUS_META: Record<
  IdentityStatus,
  { badge: string; className: string }
> = {
  in_review: { badge: 'In behandeling', className: 'st-pending' },
  not_started: { badge: 'Niet geverifieerd', className: 'st-todo' },
  rejected: { badge: 'Niet gelukt', className: 'st-failed' },
  verified: { badge: 'Geverifieerd', className: 'st-done' },
}

const DotIcon: FC<{ status: IdentityStatus }> = ({ status }) => {
  if (status === 'verified') {
    return (
      <svg
        fill="none"
        height="13"
        stroke="currentColor"
        strokeWidth="3.2"
        viewBox="0 0 24 24"
        width="13"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )
  }
  if (status === 'in_review') {
    return (
      <svg
        fill="none"
        height="13"
        stroke="currentColor"
        strokeWidth="2.6"
        viewBox="0 0 24 24"
        width="13"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    )
  }
  return (
    <svg
      fill="none"
      height="13"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="3"
      viewBox="0 0 24 24"
      width="13"
    >
      <path d="M12 6v8M12 18h.01" />
    </svg>
  )
}

const ArrowIcon: FC = () => (
  <svg
    fill="none"
    height="15"
    stroke="currentColor"
    strokeWidth="2.2"
    viewBox="0 0 24 24"
    width="15"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

const ShieldIcon: FC = () => (
  <svg
    fill="none"
    height="13"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="13"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const statusMessage = (status: IdentityStatus): ReactNode => {
  switch (status) {
    case 'not_started':
      return (
        <span>
          <strong>Je identiteit is nog niet geverifieerd.</strong> Dit is
          eenmalig nodig voordat je je bedrijf in de markt kunt zetten en
          contact kunt leggen met kopers.
        </span>
      )
    case 'in_review':
      return (
        <span>
          <strong>Je verificatie wordt beoordeeld.</strong> Dit duurt meestal
          enkele minuten, maar kan oplopen tot 24 uur. Je krijgt bericht per
          e-mail.
        </span>
      )
    case 'verified':
      return (
        <span>
          <strong>Je identiteit is bevestigd.</strong> Je kunt je bedrijf in
          de markt zetten en contact leggen met kopers.
        </span>
      )
    case 'rejected':
      return (
        <span>
          <strong>De verificatie is niet gelukt.</strong> Dit komt meestal
          door een onscherpe foto, een verlopen document of te weinig licht.
        </span>
      )
  }
}

export const IdentityVerificationCard: FC<Props> = ({ profile }) => {
  const [isPending, startTransition] = useTransition()
  const showToast = useToastStore(state => state.showToast)
  const meta = STATUS_META[profile.status]

  const onStart = (): void => {
    startTransition(async () => {
      const result = await startIdentityVerification()
      if (result.error !== null || !result.url) {
        showToast(result.error ?? 'Verificatie starten mislukt.', 'error')
        return
      }
      window.location.href = result.url
    })
  }

  const onRefresh = (): void => {
    startTransition(async () => {
      const result = await refreshIdentityStatus()
      if (result.error !== null) {
        showToast(result.error, 'error')
      }
    })
  }

  const details: Array<[string, string]> = [
    ['Status', meta.badge],
  ]
  if (profile.status === 'verified') {
    details.push(['Geverifieerd op', formatDate(profile.verifiedAt)])
    if (profile.documentName) {
      details.push(['Naam volgens document', profile.documentName])
    }
    if (profile.documentType) {
      details.push(['Type document', profile.documentType])
    }
  } else if (profile.status === 'in_review') {
    details.push(['Ingediend op', formatDateTime(profile.submittedAt)])
  } else if (profile.status === 'rejected') {
    details.push(['Laatste poging', formatDateTime(profile.submittedAt)])
  }

  return (
    <div className={`card identity-card ${meta.className}`}>
      <div className="identity-head">
        <div>
          <h3>Identiteitsverificatie</h3>
          <p className="desc">
            Osago controleert eenmalig je identiteit voordat je bedrijf in de
            markt gaat.
          </p>
        </div>
        <span className="identity-badge">{meta.badge}</span>
      </div>

      <div className="identity-status">
        <span className="identity-status-dot">
          <DotIcon status={profile.status} />
        </span>
        {statusMessage(profile.status)}
      </div>

      <div className="identity-details">
        {details.map(([k, v]) => (
          <div className="identity-detail-row" key={k}>
            <span className="identity-detail-k">{k}</span>
            <span className="identity-detail-v">{v}</span>
          </div>
        ))}
      </div>

      {profile.status === 'rejected' && profile.lastError && (
        <p className="identity-cause">
          <strong>Reden:</strong> {profile.lastError}
        </p>
      )}

      {profile.status !== 'verified' && (
        <div className="identity-cta">
          {profile.status === 'not_started' && (
            <>
              <button
                className="btn btn-primary"
                disabled={isPending}
                onClick={onStart}
                type="button"
              >
                {isPending ? 'Bezig...' : 'Start verificatie'}
                <ArrowIcon />
              </button>
              <span className="identity-meta">Duurt ongeveer 2 minuten</span>
            </>
          )}
          {profile.status === 'in_review' && (
            <button
              className="btn btn-secondary"
              disabled={isPending}
              onClick={onRefresh}
              type="button"
            >
              {isPending ? 'Bezig...' : 'Status vernieuwen'}
            </button>
          )}
          {profile.status === 'rejected' && (
            <>
              <button
                className="btn btn-primary"
                disabled={isPending}
                onClick={onStart}
                type="button"
              >
                {isPending ? 'Bezig...' : 'Opnieuw proberen'}
                <ArrowIcon />
              </button>
              <span className="identity-meta">
                Lukt het niet?{' '}
                <a href="mailto:info@osago.nl">Neem contact op</a>
              </span>
            </>
          )}
        </div>
      )}

      <div className="identity-privacy">
        <ShieldIcon />
        <span>
          Verificatie verloopt via Stripe Identity. Osago slaat geen kopie van
          je identiteitsbewijs op.
        </span>
      </div>
    </div>
  )
}
