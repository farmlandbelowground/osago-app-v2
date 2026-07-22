'use client'

import { type FC, type ReactNode } from 'react'

import {
  SOCIALS_BRAND,
  SOCIALS_PLATFORM_SPECS,
  SOCIALS_PLATFORMS,
} from '../../constants'
import { type InstagramData, type SingleVisualData } from '../../types'
import { SocialsInstagramPreview } from '../SocialsInstagramPreview'
import { SocialsPlatformIcon } from '../SocialsPlatformIcon'
import { SocialsSingleVisualPreview } from '../SocialsSingleVisualPreview'
import { type Props } from './types'

const Spinner: FC<{ size: number }> = ({ size }) => (
  <span
    style={{
      animation: 'spin360 .8s linear infinite',
      border: `2px solid ${SOCIALS_BRAND.accent}`,
      borderRadius: '50%',
      borderTopColor: 'transparent',
      display: 'inline-block',
      height: size,
      width: size,
    }}
  />
)

export const SocialsPreviewTabs: FC<Props> = ({ socials }) => {
  const tab = socials.activeTab
  const result = socials.results?.[tab]

  const renderContent = (): ReactNode => {
    if (socials.loadingStates[tab]) {
      return (
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            minHeight: 480,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 12 }}>
              <Spinner size={36} />
            </div>
            <div style={{ color: SOCIALS_BRAND.inkSoft, fontSize: 13 }}>
              {tab === 'instagram'
                ? 'Slides aan het schrijven...'
                : 'Visual aan het bouwen...'}
            </div>
          </div>
        </div>
      )
    }

    if (result && 'error' in result) {
      return (
        <div
          style={{
            alignItems: 'center',
            color: SOCIALS_BRAND.inkSoft,
            display: 'flex',
            justifyContent: 'center',
            minHeight: 480,
            padding: 24,
          }}
        >
          <div style={{ maxWidth: 420, textAlign: 'center' }}>
            <div
              style={{
                color: SOCIALS_BRAND.ink,
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              Genereren voor {SOCIALS_PLATFORM_SPECS[tab].name} mislukt.
            </div>
            {result.message && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  color: '#991b1b',
                  fontFamily: 'monospace',
                  fontSize: 11.5,
                  marginTop: 8,
                  padding: 10,
                  textAlign: 'left',
                  wordBreak: 'break-word',
                }}
              >
                {result.message}
              </div>
            )}
            <button
              onClick={() => void socials.generateAll()}
              style={{
                background: 'none',
                border: 0,
                color: SOCIALS_BRAND.accent,
                cursor: 'pointer',
                fontSize: 12,
                marginTop: 12,
                textDecoration: 'underline',
              }}
              type="button"
            >
              Probeer opnieuw
            </button>
          </div>
        </div>
      )
    }

    if (!result) {
      return null
    }

    if (tab === 'instagram') {
      return (
        <SocialsInstagramPreview
          generated={result as InstagramData}
          socials={socials}
        />
      )
    }

    return (
      <SocialsSingleVisualPreview
        generated={result as SingleVisualData}
        platform={tab}
        socials={socials}
      />
    )
  }

  return (
    <>
      <div
        style={{
          background: SOCIALS_BRAND.bgSoft,
          borderBottom: `1px solid ${SOCIALS_BRAND.border}`,
          display: 'flex',
        }}
      >
        {SOCIALS_PLATFORMS.map(platform => {
          const isLoading = Boolean(socials.loadingStates[platform])
          const platformResult = socials.results?.[platform]
          const hasResult = platformResult && !('error' in platformResult)
          const hasError = platformResult && 'error' in platformResult
          const isActive = tab === platform

          return (
            <button
              key={platform}
              onClick={() => socials.setActiveTab(platform)}
              style={{
                alignItems: 'center',
                background: isActive ? '#fff' : 'transparent',
                border: 0,
                borderBottom: `2px solid ${
                  isActive ? SOCIALS_BRAND.accent : 'transparent'
                }`,
                color: isActive ? SOCIALS_BRAND.greenDeep : SOCIALS_BRAND.inkSoft,
                cursor: 'pointer',
                display: 'flex',
                flex: 1,
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 600,
                gap: 6,
                justifyContent: 'center',
                padding: '12px 14px',
                textTransform: 'capitalize',
              }}
              type="button"
            >
              <SocialsPlatformIcon platform={platform} />
              <span>{platform}</span>
              {isLoading && <Spinner size={12} />}
              {hasResult && (
                <span style={{ color: SOCIALS_BRAND.accent }}>✓</span>
              )}
              {hasError && <span style={{ color: '#dc2626' }}>✕</span>}
            </button>
          )
        })}
      </div>
      <div style={{ padding: 26 }}>{renderContent()}</div>
    </>
  )
}
