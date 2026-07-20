import Link from 'next/link'
import { type CSSProperties, type FC } from 'react'

import { BuildingIcon } from '@features/company/assets/icons'
import { WaardebepalingIcon } from '@features/navigation/assets/icons'
import {
  MIN_FULL_PLAN_PRICE,
  MIN_VALUATION_PLAN_PRICE,
} from '@features/subscriptions/constants'
import { formatEuro } from '@features/subscriptions/lib/formatEuro'

import { WELKOM_PATHS } from '../../constants'

const cardStyle: CSSProperties = {
  background: '#fff',
  border: '1px solid var(--line)',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '28px 26px',
  textAlign: 'left',
  transition: 'all .15s',
  width: '100%',
}

const iconBadgeStyle: CSSProperties = {
  alignItems: 'center',
  background: 'var(--green-soft)',
  borderRadius: 12,
  color: 'var(--green-dark)',
  display: 'inline-flex',
  height: 46,
  justifyContent: 'center',
  marginBottom: 6,
  width: 46,
}

export const OnboardingSubscribeIntentPicker: FC = () => (
  <div style={{ margin: '0 auto', maxWidth: 880 }}>
    <div className="page-header" style={{ justifyContent: 'center', textAlign: 'center' }}>
      <div>
        <h1 className="page-title" style={{ fontSize: 30 }}>
          Wat wil je doen met Osago?
        </h1>
        <p className="page-sub text-muted" style={{ fontSize: 15, marginTop: 6 }}>
          Maak een keuze om de bijpassende abonnementen te zien.
        </p>
      </div>
    </div>

    <div className="grid-2 grid" style={{ gap: 18, marginTop: 24 }}>
      <Link className="card" href={`${WELKOM_PATHS[2]}?intent=full`} style={cardStyle}>
        <div style={iconBadgeStyle}>
          <BuildingIcon height={22} width={22} />
        </div>
        <h3 className="serif" style={{ fontSize: 22, margin: 0 }}>
          Mijn bedrijf verkopen
        </h3>
        <p className="text-sm" style={{ color: 'var(--ink-2)', lineHeight: 1.55, margin: 0 }}>
          Volledige begeleiding van waardebepaling, kopermatching en NDA tot
          verkoopcontract.
        </p>
        <div className="text-muted text-xs" style={{ marginTop: 6 }}>
          Vanaf{' '}
          <strong style={{ color: 'var(--ink)' }}>
            {formatEuro(MIN_FULL_PLAN_PRICE)}
          </strong>
        </div>
      </Link>

      <Link className="card" href={`${WELKOM_PATHS[2]}?intent=valuation`} style={cardStyle}>
        <div style={iconBadgeStyle}>
          <WaardebepalingIcon height={22} width={22} />
        </div>
        <h3 className="serif" style={{ fontSize: 22, margin: 0 }}>
          Alleen een waardebepaling
        </h3>
        <p className="text-sm" style={{ color: 'var(--ink-2)', lineHeight: 1.55, margin: 0 }}>
          Een indicatieve waardering van jouw onderneming met (optioneel)
          validatie door een adviseur.
        </p>
        <div className="text-muted text-xs" style={{ marginTop: 6 }}>
          Vanaf{' '}
          <strong style={{ color: 'var(--ink)' }}>
            {formatEuro(MIN_VALUATION_PLAN_PRICE)}
          </strong>
        </div>
      </Link>
    </div>
  </div>
)
