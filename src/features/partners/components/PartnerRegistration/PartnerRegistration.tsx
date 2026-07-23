import { type CSSProperties, type FC } from 'react'

import { RegisterForm } from '@features/auth'
import { describeVoucher } from '@features/subscriptions/lib/describeVoucher'
import osagoLogo from '@shared/assets/logo.png'

import { type Props } from './types'

// Verbatim legacy inline styles for the dual-logo boxes (osago-bundle.js:
// 29443-29473). Both boxes are exactly the same size so the partner and Osago
// marks read as equals; the Osago logo is a wide mark, so it gets extra padding.
const LOGO_BOX_STYLE: CSSProperties = {
  alignItems: 'center',
  background: '#fff',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: 12,
  boxSizing: 'border-box',
  display: 'flex',
  flexShrink: 0,
  height: 80,
  justifyContent: 'center',
  overflow: 'hidden',
  width: 180,
}
const PARTNER_INNER_PAD: CSSProperties = { padding: '14px 18px' }
const OSAGO_INNER_PAD: CSSProperties = { padding: '22px 32px' }
const IMG_CENTER_STYLE: CSSProperties = {
  display: 'block',
  height: 'auto',
  margin: 'auto',
  maxHeight: '100%',
  maxWidth: '100%',
  objectFit: 'contain',
  width: 'auto',
}

// The co-branded registration shell for /partner/[slug]: partner side panel
// (both logos, "in samenwerking met Osago", description, optional voucher card)
// + the unchanged Slice 1 <RegisterForm/>. Renders its own two-column shell
// reusing the .auth-* classes rather than routing through (auth)/layout.tsx,
// which has no per-request branding seam (OQ-4).
export const PartnerRegistration: FC<Props> = ({ partner, voucher }) => {
  return (
    <div className="auth-wrap">
      <div className="auth-side">
        <div className="logo" />

        <div className="auth-hero" style={{ marginTop: 8 }}>
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 14,
              marginBottom: 18,
            }}
          >
            {partner.logo ? (
              <div style={{ ...LOGO_BOX_STYLE, ...PARTNER_INNER_PAD }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URL, next/image cannot optimize */}
                <img
                  alt={partner.name}
                  src={partner.logo}
                  style={IMG_CENTER_STYLE}
                />
              </div>
            ) : (
              <div
                style={{
                  ...LOGO_BOX_STYLE,
                  ...PARTNER_INNER_PAD,
                  color: 'var(--ink)',
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                }}
              >
                {partner.name}
              </div>
            )}
            <div
              style={{
                color: '#fff',
                fontSize: 24,
                fontWeight: 300,
                opacity: 0.85,
              }}
            >
              ×
            </div>
            <div style={{ ...LOGO_BOX_STYLE, ...OSAGO_INNER_PAD }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- keep the exact legacy contain/center behaviour across aspect ratios */}
              <img alt="Osago" src={osagoLogo.src} style={IMG_CENTER_STYLE} />
            </div>
          </div>

          <h1 style={{ fontSize: 30, lineHeight: 1.15 }}>
            {partner.name}
            <br />
            <em
              style={{
                color: 'rgba(255,255,255,0.78)',
                fontSize: 18,
                fontStyle: 'normal',
                fontWeight: 400,
              }}
            >
              in samenwerking met Osago
            </em>
          </h1>
          <p>
            {partner.description ||
              `Welkom! Via ${partner.name} kun je hier eenvoudig een Osago-account aanmaken om jouw bedrijfsverkoop voor te bereiden — van waardebepaling tot deal closing.`}
          </p>

          {voucher && (
            <div
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 10,
                marginTop: 18,
                padding: '14px 18px',
              }}
            >
              <div
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  marginBottom: 4,
                  textTransform: 'uppercase',
                }}
              >
                Jouw partnerkorting
              </div>
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>
                {voucher.code} — {describeVoucher(voucher)}
              </div>
              <div
                style={{
                  color: 'rgba(255,255,255,0.78)',
                  fontSize: 12.5,
                  marginTop: 4,
                }}
              >
                Gebruik code «{voucher.code}» bij het afsluiten van je
                abonnement.
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            fontSize: 13,
            lineHeight: 1.55,
            marginTop: 24,
            opacity: 0.78,
          }}
        >
          Door je via deze partnerlink te registreren wordt jouw account
          gekoppeld aan {partner.name} zodat zij zicht houden op de
          samenwerking. Je sluit het abonnement zelf bij Osago af.
        </div>
      </div>

      <div className="auth-form">
        <div className="auth-form-inner">
          <RegisterForm referralPartnerSlug={partner.slug} />
        </div>
      </div>
    </div>
  )
}
