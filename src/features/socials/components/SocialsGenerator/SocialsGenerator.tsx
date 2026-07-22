'use client'

import { type CSSProperties, type FC } from 'react'

import {
  SOCIALS_BRAND,
  SOCIALS_BRAND_VARS,
  SOCIALS_PLATFORMS,
} from '../../constants'
import { useSocialsGenerator } from '../../hooks/useSocialsGenerator'
import { SocialsInputForm } from '../SocialsInputForm'
import { SocialsPreviewTabs } from '../SocialsPreviewTabs'

export const SocialsGenerator: FC = () => {
  const socials = useSocialsGenerator()
  const anyLoading = SOCIALS_PLATFORMS.some(
    platform => socials.loadingStates[platform],
  )
  const showEmpty = socials.results === null && !anyLoading

  const rootStyle = {
    ...SOCIALS_BRAND_VARS,
    color: 'var(--sg-ink)',
    fontFamily: "'Inter', system-ui, sans-serif",
  } as CSSProperties

  return (
    <div style={rootStyle}>
      <div
        style={{
          alignItems: 'start',
          display: 'grid',
          gap: 28,
          gridTemplateColumns: '380px 1fr',
        }}
      >
        <SocialsInputForm socials={socials} />
        <div>
          <div
            style={{
              background: '#fff',
              border: `1px solid ${SOCIALS_BRAND.border}`,
              borderRadius: 14,
              boxShadow: '0 20px 40px rgba(15,23,42,0.06)',
              minHeight: 600,
              overflow: 'hidden',
            }}
          >
            {showEmpty ? (
              <div
                style={{
                  alignItems: 'center',
                  display: 'flex',
                  justifyContent: 'center',
                  minHeight: 600,
                  padding: 32,
                  textAlign: 'center',
                }}
              >
                <div style={{ maxWidth: 420 }}>
                  <div
                    style={{
                      alignItems: 'center',
                      background: SOCIALS_BRAND.greenLight,
                      borderRadius: '50%',
                      color: SOCIALS_BRAND.accentHover,
                      display: 'flex',
                      height: 60,
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      width: 60,
                    }}
                  >
                    <svg
                      fill="none"
                      height="24"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="24"
                    >
                      <path d="M12 3l1.9 5.8L19 11l-5.1 2.2L12 19l-1.9-5.8L5 11l5.1-2.2z" />
                    </svg>
                  </div>
                  <h3
                    style={{
                      color: SOCIALS_BRAND.ink,
                      fontFamily: "'Times New Roman', serif",
                      fontSize: 22,
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    Klaar om te genereren
                  </h3>
                  <p
                    style={{
                      color: SOCIALS_BRAND.inkSoft,
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      marginTop: 10,
                    }}
                  >
                    Eén onderwerp wordt omgezet in drie platform-specifieke
                    posts. Je krijgt automatisch een carrousel voor Instagram en
                    visuele afbeeldingen voor LinkedIn en Facebook — in{' '}
                    <em
                      style={{
                        color: SOCIALS_BRAND.accent,
                        fontStyle: 'italic',
                      }}
                    >
                      Osago-stijl
                    </em>
                    .
                  </p>
                </div>
              </div>
            ) : (
              <SocialsPreviewTabs socials={socials} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
