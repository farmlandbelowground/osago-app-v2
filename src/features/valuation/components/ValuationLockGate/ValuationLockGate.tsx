import { type FC, type ReactNode } from 'react'

import { MakeValuationButton } from '../MakeValuationButton'
import { ValuationUnlockButton } from '../medewerker/ValuationUnlockButton'
import { ValuationReviewUpsellButton } from '../ValuationReviewUpsellButton'
import { ValuationSubmitReviewButton } from '../ValuationSubmitReviewButton'
import {
  APPROVED_BODY,
  APPROVED_TITLE,
  BUTTON_ROW_STYLE,
  DEFAULT_BODY,
  DEFAULT_TITLE,
  REVIEW_BODY,
  REVIEW_TITLE,
  SUBMITTED_BODY,
  SUBMITTED_TITLE,
} from './constants'
import { type Props } from './types'

interface OverlayContent {
  body: string
  buttons: ReactNode
  title: string
}

// Ports legacy's .val-locked gate and its four overlay states
// (osago-bundle.js:14973-15118): until the valuation is locked in, the computed
// values are blurred behind a frosted overlay. Which prompt appears depends on
// whether the customer's plan requires an Osago review first.
const resolveOverlay = (
  requiresReview: boolean,
  reviewStatus: Props['reviewStatus'],
  isMedewerker: boolean,
): OverlayContent => {
  if (!requiresReview) {
    return {
      body: DEFAULT_BODY,
      buttons: (
        <>
          <ValuationReviewUpsellButton />
          <MakeValuationButton />
        </>
      ),
      title: DEFAULT_TITLE,
    }
  }

  if (reviewStatus === 'submitted') {
    return {
      body: SUBMITTED_BODY,
      buttons: (
        <>
          <button className="btn btn-secondary" disabled type="button">
            Ingediend — wacht op vrijschakeling
          </button>
          {isMedewerker && <ValuationUnlockButton />}
        </>
      ),
      title: SUBMITTED_TITLE,
    }
  }

  if (reviewStatus === 'approved') {
    return {
      body: APPROVED_BODY,
      buttons: <MakeValuationButton />,
      title: APPROVED_TITLE,
    }
  }

  return {
    body: REVIEW_BODY,
    buttons: <ValuationSubmitReviewButton />,
    title: REVIEW_TITLE,
  }
}

export const ValuationLockGate: FC<Props> = ({
  children,
  isMade,
  isMedewerker,
  requiresReview,
  reviewStatus,
}) => {
  const overlay = resolveOverlay(requiresReview, reviewStatus, isMedewerker)

  return (
    <div className="val-locked-wrap">
      <div className={isMade ? undefined : 'val-locked-content'}>
        {children}
      </div>
      {!isMade && (
        <div className="val-locked-overlay">
          <div className="val-locked-message">
            <h3>{overlay.title}</h3>
            <p>{overlay.body}</p>
            <div style={BUTTON_ROW_STYLE}>{overlay.buttons}</div>
          </div>
        </div>
      )}
    </div>
  )
}
