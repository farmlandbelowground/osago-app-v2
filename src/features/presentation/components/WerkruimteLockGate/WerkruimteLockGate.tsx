import Link from 'next/link'
import { type FC } from 'react'

import { VERKOOPPRESENTATIE_PATH } from '../../constants/routes'
import { type Props } from './types'

// Ports wrapWerkruimteLock (osago-bundle.js:19159-19173) — mirrors the Slice 6
// ValuationLockGate markup/classes. Unlock = both memorandum AND anon profile in
// the vault (computed server-side, passed as `unlocked`).
export const WerkruimteLockGate: FC<Props> = ({ children, unlocked }) => {
  if (unlocked) {
    return <>{children}</>
  }

  return (
    <div className="val-locked-wrap">
      <div className="val-locked-content">{children}</div>
      <div className="val-locked-overlay">
        <div className="val-locked-message">
          <h3>Werkruimte vergrendeld</h3>
          <p>
            Maak eerst het <strong>verkoopmemorandum</strong> en het{' '}
            <strong>anoniem verkoopprofiel</strong> via Presentatie. Daarna kun
            je kopers benaderen en het verkoopproces beheren.
          </p>
          <Link className="btn btn-primary" href={VERKOOPPRESENTATIE_PATH}>
            Naar Presentatie
          </Link>
        </div>
      </div>
    </div>
  )
}
