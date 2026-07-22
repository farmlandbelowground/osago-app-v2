'use client'

import { type FC } from 'react'

import { SOCIALS_BRAND, SOCIALS_PLATFORM_SPECS } from '../../constants'
import { type Props } from './types'

export const SocialsSingleVisualPreview: FC<Props> = ({
  generated,
  platform,
  socials,
}) => {
  const visual = generated.visual
  const spec = SOCIALS_PLATFORM_SPECS[platform]
  const ill = socials.illustrations[0]
  const copied = socials.copiedPlatform === platform

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div
          style={{
            color: SOCIALS_BRAND.inkSoft,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          {spec.name} · {spec.label}
        </div>
        <h2
          style={{
            color: SOCIALS_BRAND.ink,
            fontFamily: "'Times New Roman', serif",
            fontSize: 21,
            fontWeight: 600,
            margin: '2px 0 0',
          }}
        >
          Visuele afbeelding
        </h2>
      </div>

      <div
        style={{
          aspectRatio: `${spec.w} / ${spec.h}`,
          background: `linear-gradient(135deg, ${SOCIALS_BRAND.greenDarker} 0%, ${SOCIALS_BRAND.greenDeep} 50%, ${SOCIALS_BRAND.greenDarker} 100%)`,
          border: `1px solid ${SOCIALS_BRAND.border}`,
          borderRadius: 12,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            background: SOCIALS_BRAND.accent,
            height: 5,
            position: 'absolute',
            right: 0,
            top: 0,
            width: 120,
          }}
        />
        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: '55% 45%',
            inset: 0,
            padding: 22,
            position: 'absolute',
          }}
        >
          <div
            style={{
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                fontFamily: "'Times New Roman', serif",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              Osago
            </div>
            <div>
              <h3
                style={{
                  color: '#fff',
                  fontFamily: "'Times New Roman', serif",
                  fontSize: 22,
                  fontWeight: 600,
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                {visual.headline}
              </h3>
              <p
                style={{
                  color: SOCIALS_BRAND.mint,
                  fontFamily: "'Times New Roman', serif",
                  fontSize: 12.5,
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                  margin: '8px 0 0',
                }}
              >
                {visual.subline}
              </p>
            </div>
            <div>
              <span
                style={{
                  alignItems: 'center',
                  background: SOCIALS_BRAND.accent,
                  borderRadius: 8,
                  color: '#fff',
                  display: 'inline-flex',
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: '8px 14px',
                }}
              >
                Begin gratis op osago.nl
              </span>
            </div>
          </div>
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {ill ? (
              <div
                style={{
                  alignItems: 'center',
                  background: '#fff',
                  borderRadius: 10,
                  display: 'flex',
                  height: '100%',
                  justifyContent: 'center',
                  padding: 12,
                  width: '100%',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- base64 data-URI */}
                <img
                  alt=""
                  src={ill.src}
                  style={{
                    maxHeight: '100%',
                    maxWidth: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.95)',
                  borderRadius: 10,
                  color: SOCIALS_BRAND.inkMuted,
                  display: 'flex',
                  fontSize: 9,
                  height: '100%',
                  justifyContent: 'center',
                  letterSpacing: 1,
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  width: '100%',
                }}
              >
                Upload illustratie
              </div>
            )}
          </div>
        </div>
      </div>

      {visual.illustration_hint && (
        <div
          style={{
            borderLeft: `2px solid ${SOCIALS_BRAND.accent}`,
            color: SOCIALS_BRAND.inkSoft,
            fontSize: 12,
            paddingLeft: 10,
          }}
        >
          <span style={{ color: SOCIALS_BRAND.greenDeep, fontWeight: 600 }}>
            Illustratie-suggestie:{' '}
          </span>
          {visual.illustration_hint}
        </div>
      )}

      <button
        onClick={() => socials.copyText(platform)}
        style={{
          alignItems: 'center',
          background: '#fff',
          border: `1px solid ${SOCIALS_BRAND.border}`,
          borderRadius: 8,
          color: SOCIALS_BRAND.ink,
          cursor: 'pointer',
          display: 'flex',
          fontFamily: 'inherit',
          fontSize: 12,
          fontWeight: 600,
          gap: 6,
          justifyContent: 'center',
          padding: '10px 12px',
          width: '100%',
        }}
        type="button"
      >
        {copied ? 'Post gekopieerd' : 'Kopieer post'}
      </button>

      <div
        style={{
          borderTop: `1px solid ${SOCIALS_BRAND.border}`,
          paddingTop: 18,
        }}
      >
        <div
          style={{
            color: SOCIALS_BRAND.inkSoft,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.2em',
            marginBottom: 8,
            textTransform: 'uppercase',
          }}
        >
          Post tekst
        </div>
        <div
          style={{
            background: SOCIALS_BRAND.bgSoft,
            border: `1px solid ${SOCIALS_BRAND.border}`,
            borderRadius: 8,
            maxHeight: 280,
            overflowY: 'auto',
            padding: 14,
          }}
        >
          <pre
            style={{
              color: SOCIALS_BRAND.ink,
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 13,
              lineHeight: 1.55,
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {generated.post}
          </pre>
        </div>
      </div>
    </div>
  )
}
