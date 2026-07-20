import { type FC } from 'react'

import { MakeValuationButton } from '../MakeValuationButton'
import { ValuationReviewUpsellButton } from '../ValuationReviewUpsellButton'
import { type Props } from './types'

// Ports legacy's .val-locked gate (osago-bundle.js:14853-14997): until the
// valuation is locked in, the computed values are blurred behind a frosted
// overlay prompting the customer to make the valuation. The premium
// review-flow button variants ("Controle door Osago aanvragen" etc.) are
// deferred with the rest of the review UI (spec §46).
const LOCKED_BODY =
  'Klik hieronder om jouw indicatieve waardebepaling vast te leggen. Daarna verschijnen de waardes en kun je het PDF-rapport downloaden.'

export const ValuationLockGate: FC<Props> = ({ children, isMade }) => {
  if (isMade) {
    return <>{children}</>
  }

  return (
    <div className="val-locked-wrap">
      <div className="val-locked-content">{children}</div>
      <div className="val-locked-overlay">
        <div className="val-locked-message">
          <h3>Waardering nog niet gemaakt</h3>
          <p>{LOCKED_BODY}</p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center',
            }}
          >
            <ValuationReviewUpsellButton />
            <MakeValuationButton />
          </div>
        </div>
      </div>
    </div>
  )
}
