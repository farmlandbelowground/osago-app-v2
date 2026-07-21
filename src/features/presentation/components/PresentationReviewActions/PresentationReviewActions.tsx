'use client'

import { useRouter } from 'next/navigation'
import { useState, type CSSProperties, type FC, type ReactNode } from 'react'

import { useToastStore } from '@shared/store/toast'

import { submitPresentationForReview } from '../../actions'
import { type Props } from './types'

type ActiveModal = 'none' | 'submitConfirm' | 'upsellInfo' | 'upsellConfirm'

const iconStyle: CSSProperties = { marginRight: 4, verticalAlign: '-2px' }

const amberAlertStyle: CSSProperties = {
  background: '#FEF7E6',
  borderLeft: '3px solid #D97706',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--ink)',
  fontSize: 13.5,
  lineHeight: 1.55,
  marginBottom: 16,
  padding: '14px 16px',
}

const checkCircleStyle: CSSProperties = {
  alignItems: 'center',
  background: 'var(--green-soft)',
  borderRadius: '50%',
  color: 'var(--green-dark)',
  display: 'inline-flex',
  height: 56,
  justifyContent: 'center',
  marginBottom: 14,
  width: 56,
}

const DownloadIcon: FC = () => (
  <svg
    fill="none"
    height="14"
    stroke="currentColor"
    strokeWidth="2"
    style={iconStyle}
    viewBox="0 0 24 24"
    width="14"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
)

const LockIcon: FC = () => (
  <svg
    fill="none"
    height="13"
    stroke="currentColor"
    strokeWidth="2"
    style={iconStyle}
    viewBox="0 0 24 24"
    width="13"
  >
    <rect height="11" rx="2" width="18" x="3" y="11" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const ConfirmationModal: FC<{
  children: ReactNode
  onClose: () => void
  title: string
}> = ({ children, onClose, title }) => (
  <div className="modal-overlay active" onClick={onClose}>
    <div className="modal" onClick={event => event.stopPropagation()}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button
          aria-label="Sluiten"
          className="modal-close"
          onClick={onClose}
          type="button"
        >
          ✕
        </button>
      </div>
      <div className="modal-body">
        <div style={{ padding: '6px 0', textAlign: 'center' }}>
          <div style={checkCircleStyle}>
            <svg
              fill="none"
              height="28"
              stroke="currentColor"
              strokeWidth="3"
              viewBox="0 0 24 24"
              width="28"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p
            style={{
              color: 'var(--ink-2)',
              fontSize: 14.5,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {children}
          </p>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-primary" onClick={onClose} type="button">
          Sluiten
        </button>
      </div>
    </div>
  </div>
)

// Ports the review-gate customer half (osago-bundle.js:18531-18571,
// :19334-19468): Plus/Premium submit-for-review + Basic "Controle door Osago
// aanvragen" upsell, verbatim (OQ-4). The email sends are deferred (§1.2), so the
// actions only set status / show the confirmation modals.
export const PresentationReviewActions: FC<Props> = ({
  reviewRequired,
  reviewStatus,
}) => {
  const router = useRouter()
  const showToast = useToastStore(state => state.showToast)
  const [activeModal, setActiveModal] = useState<ActiveModal>('none')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (): Promise<void> => {
    setIsSubmitting(true)
    const result = await submitPresentationForReview()
    setIsSubmitting(false)
    if (result.error !== null) {
      showToast(result.error, 'error')
      return
    }
    setActiveModal('submitConfirm')
    router.refresh()
  }

  const closeModal = (): void => setActiveModal('none')

  return (
    <>
      {reviewRequired ? (
        reviewStatus === 'submitted' ? (
          <button
            className="btn btn-secondary"
            disabled
            title="Wacht op controle door Osago"
            type="button"
          >
            <LockIcon />
            Ingediend — wacht op vrijschakeling
          </button>
        ) : (
          <button
            className="btn btn-primary"
            disabled={isSubmitting}
            onClick={() => void onSubmit()}
            type="button"
          >
            <DownloadIcon />
            Indienen ter controle
          </button>
        )
      ) : (
        <button
          className="btn btn-secondary"
          onClick={() => setActiveModal('upsellInfo')}
          title="Plus/Premium: gratis controle — Basis: aanvragen op offerte"
          type="button"
        >
          Controle door Osago aanvragen
        </button>
      )}

      {activeModal === 'submitConfirm' && (
        <ConfirmationModal onClose={closeModal} title="Ingediend ter controle">
          Je verkoopmemorandum en anoniem verkoopprofiel zijn ingediend ter
          controle.
          <br />
          Een Osago-medewerker neemt het materiaal binnen één werkdag door en
          schakelt de downloads daarna voor je vrij.
        </ConfirmationModal>
      )}

      {activeModal === 'upsellInfo' && (
        <div className="modal-overlay active" onClick={closeModal}>
          <div className="modal" onClick={event => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Controle door Osago-medewerker</h3>
              <button
                aria-label="Sluiten"
                className="modal-close"
                onClick={closeModal}
                type="button"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="alert alert-amber" style={amberAlertStyle}>
                <strong style={{ color: '#92400E' }}>
                  Plus- en Premium-feature:
                </strong>{' '}
                bij een Plus- of Premium-abonnement controleert een
                Osago-medewerker jouw verkoopmemorandum en anoniem
                verkoopprofiel vóór ze beschikbaar komen — extra zekerheid dat
                het materiaal professioneel oogt en geen vertrouwelijke
                informatie bevat die er niet in hoort.
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, margin: '0 0 12px' }}>
                Op het Basis-pakket kun je deze losse controle alsnog aanvragen
                tegen een eenmalig tarief. Een Osago-medewerker neemt dan binnen
                één werkdag contact met je op om het in te plannen.
              </p>
              <p className="text-sm text-muted" style={{ margin: 0 }}>
                Je kunt overigens nu al direct het memorandum en profiel zelf
                maken — die opties blijven beschikbaar.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={closeModal}
                type="button"
              >
                Sluiten
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setActiveModal('upsellConfirm')}
                type="button"
              >
                Controle aanvragen
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'upsellConfirm' && (
        <ConfirmationModal onClose={closeModal} title="Aanvraag ontvangen">
          Je aanvraag voor een controle van je presentatie is binnengekomen.
          <br />
          Een Osago-medewerker neemt binnen één werkdag persoonlijk contact met
          je op.
        </ConfirmationModal>
      )}
    </>
  )
}
