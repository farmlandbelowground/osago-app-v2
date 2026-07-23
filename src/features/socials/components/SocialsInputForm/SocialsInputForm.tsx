'use client'

import { useRef, type FC } from 'react'

import { ALLOWED_IMAGE_ACCEPT } from '@shared/upload'

import {
  OPACITY_DISABLED_SOFT,
  SOCIALS_ANGLE_OPTIONS,
  SOCIALS_AUDIENCE_OPTIONS,
  SOCIALS_BRAND,
  SOCIALS_ILLUSTRATIONS,
  SOCIALS_PLATFORM_SPECS,
  SOCIALS_PLATFORMS,
  SOCIALS_TONE_OPTIONS,
} from '../../constants'
import { SocialsPlatformIcon } from '../SocialsPlatformIcon'
import { type Props } from './types'

const LABEL_STYLE = {
  color: 'var(--sg-inkSoft)',
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.16em',
  marginBottom: 6,
  textTransform: 'uppercase',
} as const

const SELECT_STYLE = {
  background: '#fff',
  border: '1px solid var(--sg-border)',
  borderRadius: 8,
  fontFamily: 'inherit',
  fontSize: 13.5,
  padding: '10px 12px',
  width: '100%',
} as const

export const SocialsInputForm: FC<Props> = ({ socials }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const anyLoading = SOCIALS_PLATFORMS.some(
    platform => socials.loadingStates[platform],
  )
  const hasAnyResult =
    socials.results !== null &&
    SOCIALS_PLATFORMS.some(platform => {
      const result = socials.results?.[platform]
      return result && !('error' in result)
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div
        className="card"
        style={{
          background: 'var(--sg-bgSoft)',
          border: '1px solid var(--sg-border)',
          padding: '14px 16px',
        }}
      >
        <div
          style={{
            color: 'var(--sg-inkSoft)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.16em',
            marginBottom: 10,
            textTransform: 'uppercase',
          }}
        >
          Output bevat
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SOCIALS_PLATFORMS.map(platform => (
            <div
              key={platform}
              style={{ alignItems: 'center', display: 'flex', gap: 10 }}
            >
              <div
                style={{
                  alignItems: 'center',
                  background: '#fff',
                  border: '1px solid var(--sg-border)',
                  borderRadius: 8,
                  color: 'var(--sg-greenDeep)',
                  display: 'flex',
                  height: 28,
                  justifyContent: 'center',
                  width: 28,
                }}
              >
                <SocialsPlatformIcon platform={platform} />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: 'var(--sg-ink)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {SOCIALS_PLATFORM_SPECS[platform].name}
                </div>
                <div style={{ color: 'var(--sg-inkSoft)', fontSize: 11 }}>
                  {platform === 'instagram' ? 'Carrousel' : 'Visual'} ·{' '}
                  {SOCIALS_PLATFORM_SPECS[platform].label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label style={LABEL_STYLE}>Onderwerp</label>
        <textarea
          onChange={event => socials.setTopic(event.target.value)}
          placeholder="Bv: 'Waarom geen succesfee betalen', 'Hoe verkoop je je bedrijf in 6 maanden'..."
          rows={3}
          style={{
            border: '1px solid var(--sg-border)',
            borderRadius: 8,
            fontFamily: 'inherit',
            fontSize: 13.5,
            padding: '10px 12px',
            resize: 'vertical',
            width: '100%',
          }}
          value={socials.topic}
        />
      </div>

      <div>
        <label style={LABEL_STYLE}>
          Invalshoek{' '}
          <span
            style={{
              color: 'var(--sg-inkMuted)',
              fontWeight: 400,
              letterSpacing: 0,
              textTransform: 'none',
            }}
          >
            (optioneel)
          </span>
        </label>
        <select
          onChange={event => socials.setAngle(event.target.value)}
          style={SELECT_STYLE}
          value={socials.angle}
        >
          {SOCIALS_ANGLE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <label style={LABEL_STYLE}>Toon</label>
          <select
            onChange={event => socials.setTone(event.target.value)}
            style={SELECT_STYLE}
            value={socials.tone}
          >
            {SOCIALS_TONE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={LABEL_STYLE}>Doelgroep</label>
          <select
            onChange={event => socials.setAudience(event.target.value)}
            style={SELECT_STYLE}
            value={socials.audience}
          >
            {SOCIALS_AUDIENCE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label style={LABEL_STYLE}>Osago Illustraties</label>
        <div
          style={{
            background: 'var(--sg-bgSoft)',
            border: '1px solid var(--sg-border)',
            borderRadius: 10,
            marginBottom: 10,
            padding: 12,
          }}
        >
          <div
            style={{
              alignItems: 'flex-start',
              display: 'flex',
              gap: 8,
              marginBottom: 10,
            }}
          >
            <svg
              fill="none"
              height="14"
              stroke={SOCIALS_BRAND.accent}
              strokeWidth="2"
              style={{ flexShrink: 0, marginTop: 2 }}
              viewBox="0 0 24 24"
              width="14"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="16" y2="12" />
              <line x1="12" x2="12.01" y1="8" y2="8" />
            </svg>
            <div
              style={{
                color: 'var(--sg-inkSoft)',
                fontSize: 11,
                lineHeight: 1.45,
              }}
            >
              Upload de SVG&apos;s uit{' '}
              <code
                style={{
                  background: '#fff',
                  border: '1px solid var(--sg-border)',
                  borderRadius: 3,
                  fontSize: 10,
                  padding: '1px 4px',
                }}
              >
                src/assets/svg/
              </code>{' '}
              van de Osago-website. Standaard zijn er deze 5:
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {SOCIALS_ILLUSTRATIONS.map(illustration => (
              <div
                key={illustration.file}
                style={{
                  alignItems: 'baseline',
                  display: 'flex',
                  fontSize: 11,
                  gap: 8,
                }}
              >
                <code
                  style={{
                    background: '#fff',
                    border: '1px solid var(--sg-border)',
                    borderRadius: 3,
                    color: 'var(--sg-greenDeep)',
                    flexShrink: 0,
                    fontSize: 10,
                    padding: '2px 6px',
                  }}
                >
                  {illustration.file}
                </code>
                <span style={{ color: 'var(--sg-inkSoft)' }}>
                  {illustration.story}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--sg-border)',
            borderRadius: 10,
            cursor: 'pointer',
            padding: '18px 12px',
            textAlign: 'center',
          }}
        >
          <div
            style={{ color: 'var(--sg-ink)', fontSize: 13, fontWeight: 500 }}
          >
            Upload illustraties
          </div>
          <div
            style={{
              color: 'var(--sg-inkSoft)',
              fontSize: 11,
              marginTop: 2,
            }}
          >
            SVG, PNG, JPG · automatisch geknipt per platform
          </div>
          <input
            accept={ALLOWED_IMAGE_ACCEPT}
            multiple
            onChange={event => {
              socials.addIllustrations(event.target.files)
              event.target.value = ''
            }}
            ref={fileInputRef}
            style={{ display: 'none' }}
            type="file"
          />
        </div>

        {socials.illustrations.length > 0 && (
          <div
            style={{
              display: 'grid',
              gap: 6,
              gridTemplateColumns: 'repeat(4, 1fr)',
              marginTop: 10,
            }}
          >
            {socials.illustrations.map(illustration => (
              <div
                key={illustration.id}
                style={{
                  aspectRatio: '1 / 1',
                  background: '#fff',
                  border: '1px solid var(--sg-border)',
                  borderRadius: 6,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- base64 data-URI, next/image cannot optimize */}
                <img
                  alt={illustration.name}
                  src={illustration.src}
                  style={{
                    height: '100%',
                    objectFit: 'contain',
                    padding: 4,
                    width: '100%',
                  }}
                />
                <button
                  onClick={() => socials.removeIllustration(illustration.id)}
                  style={{
                    alignItems: 'center',
                    background: 'var(--sg-greenDeep)',
                    border: 0,
                    borderRadius: '50%',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    height: 18,
                    justifyContent: 'center',
                    lineHeight: 1,
                    position: 'absolute',
                    right: 3,
                    top: 3,
                    width: 18,
                  }}
                  title="Verwijderen"
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        disabled={anyLoading}
        onClick={() => void socials.generateAll()}
        style={{
          alignItems: 'center',
          background: SOCIALS_BRAND.accent,
          border: 0,
          borderRadius: 10,
          color: '#fff',
          cursor: anyLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          fontFamily: 'inherit',
          fontSize: 14,
          fontWeight: 600,
          gap: 8,
          justifyContent: 'center',
          opacity: anyLoading ? 0.5 : 1,
          padding: '14px 18px',
          width: '100%',
        }}
        type="button"
      >
        {anyLoading ? (
          <>
            <svg
              className="sg-spin"
              fill="none"
              height="14"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="14"
            >
              <line x1="12" x2="12" y1="2" y2="6" />
              <line x1="12" x2="12" y1="18" y2="22" />
              <line x1="4.93" x2="7.76" y1="4.93" y2="7.76" />
              <line x1="16.24" x2="19.07" y1="16.24" y2="19.07" />
              <line x1="2" x2="6" y1="12" y2="12" />
              <line x1="18" x2="22" y1="12" y2="12" />
              <line x1="4.93" x2="7.76" y1="19.07" y2="16.24" />
              <line x1="16.24" x2="19.07" y1="7.76" y2="4.93" />
            </svg>
            <span>Genereren voor 3 platforms...</span>
          </>
        ) : (
          <>
            <svg
              fill="none"
              height="14"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="14"
            >
              <path d="M12 3l1.9 5.8L19 11l-5.1 2.2L12 19l-1.9-5.8L5 11l5.1-2.2z" />
            </svg>
            <span>Genereer alle 3 posts</span>
          </>
        )}
      </button>

      {hasAnyResult && (
        <button
          disabled={socials.isExporting || anyLoading}
          onClick={() => void socials.exportZip()}
          style={{
            alignItems: 'center',
            background: '#fff',
            border: '1px solid var(--sg-border)',
            borderRadius: 10,
            color: 'var(--sg-greenDeep)',
            cursor: socials.isExporting ? 'not-allowed' : 'pointer',
            display: 'flex',
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 600,
            gap: 8,
            justifyContent: 'center',
            opacity:
              socials.isExporting || anyLoading ? OPACITY_DISABLED_SOFT : 1,
            padding: '13px 18px',
            width: '100%',
          }}
          type="button"
        >
          {socials.isExporting ? (
            <>
              <svg
                className="sg-spin"
                fill="none"
                height="14"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="14"
              >
                <line x1="12" x2="12" y1="2" y2="6" />
                <line x1="12" x2="12" y1="18" y2="22" />
              </svg>
              <span>ZIP samenstellen...</span>
            </>
          ) : (
            <>
              <svg
                fill="none"
                height="14"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="14"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              <span>Download ZIP (3 mappen + posts.txt)</span>
            </>
          )}
        </button>
      )}

      {socials.error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            color: '#b91c1c',
            fontSize: 13,
            lineHeight: 1.45,
            padding: '10px 12px',
          }}
        >
          {socials.error}
        </div>
      )}
    </div>
  )
}
