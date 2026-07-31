import { type FC } from 'react'

import { IdentityVerificationCard } from '@features/identity'

import { type Props } from './types'

// Verification-required dashboard (docx §5): shown once preparation is
// complete but identity is not yet verified. Small "Voorbereiding
// afgerond" acknowledgment, then the full IdentityVerificationCard —
// same component the /account page uses, driven from the same profile
// snapshot fetched by getDashboardState.

const CheckIcon: FC = () => (
  <svg
    fill="none"
    height="14"
    stroke="currentColor"
    strokeWidth="3"
    viewBox="0 0 24 24"
    width="14"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export const VerificationRequiredDashboard: FC<Props> = ({
  firstName,
  identity,
}) => (
  <main className="main">
    <h1 className="page-title">
      Welkom{firstName ? `, ${firstName}` : ''}.
    </h1>

    <div className="prep-done">
      <span className="prep-done-check">
        <CheckIcon />
      </span>
      Voorbereiding afgerond
    </div>

    <IdentityVerificationCard profile={identity} variant="dashboard" />
  </main>
)
