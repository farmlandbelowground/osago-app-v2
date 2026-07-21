import Link from 'next/link'
import { type FC } from 'react'

import {
  VALUE_DRIVERS_PATH,
  WAARDEBEPALING_PATH,
} from '@features/valuation/constants/routes'

import { type Props } from './types'

interface MissingStep {
  cta: string
  label: string
  target: string
}

export const ValuationReportPrereqGate: FC<Props> = ({
  valuationMade,
  valueDriversComplete,
}) => {
  const missing: MissingStep[] = []

  if (!valueDriversComplete) {
    missing.push({
      label: 'Vul eerst alle 27 value drivers in.',
      cta: 'Naar Value drivers',
      target: VALUE_DRIVERS_PATH,
    })
  }

  if (!valuationMade) {
    missing.push({
      label: 'Leg vervolgens de indicatieve waardering vast.',
      cta: 'Naar Waardebepaling',
      target: WAARDEBEPALING_PATH,
    })
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Waarderingsrapport</h1>
        </div>
      </div>

      <div className="card">
        <div
          className="empty"
          style={{ margin: '0 auto', maxWidth: 560, padding: '56px 24px' }}
        >
          <div className="empty-icon">
            <svg
              fill="none"
              height="24"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="24"
            >
              <rect height="11" rx="2" width="18" x="3" y="11" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h3>Waarderingsrapport nog niet beschikbaar</h3>
          <p>
            Voordat je aan het waarderingsrapport kunt werken, ronden we eerst{' '}
            {missing.length === 1 ? 'deze stap' : 'deze stappen'} af:
          </p>
          <ol
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              margin: '16px auto 24px',
              maxWidth: 420,
              paddingLeft: 20,
              textAlign: 'left',
            }}
          >
            {missing.map(step => (
              <li key={step.target} style={{ marginBottom: 8 }}>
                {step.label}
              </li>
            ))}
          </ol>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              justifyContent: 'center',
            }}
          >
            {missing.map(step => (
              <Link
                className="btn btn-primary"
                href={step.target}
                key={step.target}
              >
                {step.cta}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
