'use client'

import { type FC } from 'react'

import {
  CAROUSEL_DOT_ACTIVE_WIDTH,
  CAROUSEL_DOT_WIDTH,
  OPACITY_DIMMED,
  SOCIALS_BRAND,
} from '../../constants'
import { type Props } from './types'

export const SocialsInstagramPreview: FC<Props> = ({ generated, socials }) => {
  const slides = generated.slides
  const total = slides.length
  const idx = Math.min(Math.max(0, socials.activeSlide), Math.max(0, total - 1))
  const slide = slides[idx] ?? { body: '', title: '' }
  const ill =
    socials.illustrations.length === 0
      ? null
      : socials.illustrations[idx % socials.illustrations.length]
  const copied = socials.copiedPlatform === 'instagram'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
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
            Instagram · 1080×1350
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
            Carrousel · {total} slide{total === 1 ? '' : 's'}
          </h2>
        </div>
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
          <button
            disabled={idx === 0}
            onClick={socials.prevSlide}
            style={{
              alignItems: 'center',
              background: 'transparent',
              border: `2px solid ${SOCIALS_BRAND.greenDeep}`,
              borderRadius: '50%',
              color: SOCIALS_BRAND.greenDeep,
              cursor: idx === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              height: 34,
              justifyContent: 'center',
              opacity: idx === 0 ? OPACITY_DIMMED : 1,
              width: 34,
            }}
            type="button"
          >
            ‹
          </button>
          <span
            style={{
              color: SOCIALS_BRAND.greenDeep,
              fontSize: 13,
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 600,
              textAlign: 'center',
              width: 42,
            }}
          >
            {idx + 1}/{total}
          </span>
          <button
            disabled={idx >= total - 1}
            onClick={socials.nextSlide}
            style={{
              alignItems: 'center',
              background: 'transparent',
              border: `2px solid ${SOCIALS_BRAND.greenDeep}`,
              borderRadius: '50%',
              color: SOCIALS_BRAND.greenDeep,
              cursor: idx >= total - 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              height: 34,
              justifyContent: 'center',
              opacity: idx >= total - 1 ? OPACITY_DIMMED : 1,
              width: 34,
            }}
            type="button"
          >
            ›
          </button>
        </div>
      </div>

      <div
        style={{
          aspectRatio: '4 / 5',
          background: '#fff',
          border: `1px solid ${SOCIALS_BRAND.border}`,
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          margin: '0 auto',
          maxWidth: 380,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            background: SOCIALS_BRAND.bgSoft,
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 22px',
          }}
        >
          <div
            style={{
              color: SOCIALS_BRAND.greenDeep,
              fontFamily: "'Times New Roman', serif",
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            Osago
          </div>
          {total > 1 && (
            <div style={{ display: 'flex', gap: 3 }}>
              {slides.map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: i === idx ? SOCIALS_BRAND.accent : '#cbd5e1',
                    borderRadius: 2,
                    height: 3,
                    width: i === idx ? CAROUSEL_DOT_ACTIVE_WIDTH : CAROUSEL_DOT_WIDTH,
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flex: 1,
            justifyContent: 'center',
            minHeight: 0,
            padding: '14px 22px',
          }}
        >
          {ill ? (
            // eslint-disable-next-line @next/next/no-img-element -- base64 data-URI
            <img
              alt=""
              src={ill.src}
              style={{ maxHeight: '100%', maxWidth: '75%', objectFit: 'contain' }}
            />
          ) : (
            <div
              style={{
                alignItems: 'center',
                border: `2px dashed ${SOCIALS_BRAND.border}`,
                borderRadius: 10,
                color: SOCIALS_BRAND.inkMuted,
                display: 'flex',
                fontSize: 9,
                height: 108,
                justifyContent: 'center',
                letterSpacing: 1,
                textTransform: 'uppercase',
                width: 108,
              }}
            >
              Illustratie
            </div>
          )}
        </div>
        <div style={{ padding: '0 22px 22px' }}>
          <h3
            style={{
              color: SOCIALS_BRAND.ink,
              fontFamily: "'Times New Roman', serif",
              fontSize: 21,
              fontWeight: 600,
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            {slide.title}
          </h3>
          <p
            style={{
              color: SOCIALS_BRAND.inkSoft,
              fontSize: 13,
              lineHeight: 1.55,
              marginTop: 8,
            }}
          >
            {slide.body}
          </p>
          {slide.illustration_hint && (
            <p
              style={{
                color: SOCIALS_BRAND.accent,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 1,
                marginTop: 10,
                textTransform: 'uppercase',
              }}
            >
              → {slide.illustration_hint}
            </p>
          )}
          <div
            style={{
              background: SOCIALS_BRAND.accent,
              height: 2,
              marginTop: 14,
              width: 48,
            }}
          />
        </div>
      </div>

      <button
        onClick={() => socials.copyText('instagram')}
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
        {copied ? 'Caption gekopieerd' : 'Kopieer caption'}
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
          Caption
        </div>
        <div
          style={{
            background: SOCIALS_BRAND.bgSoft,
            border: `1px solid ${SOCIALS_BRAND.border}`,
            borderRadius: 8,
            maxHeight: 240,
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
            {generated.caption}
          </pre>
        </div>
      </div>
    </div>
  )
}
