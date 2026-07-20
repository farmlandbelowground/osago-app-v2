import { type FC } from 'react'

import { WELCOME_VIDEO_URL } from '../../constants'

export const DashboardWelcomeVideoCard: FC = () => {
  return (
    <div className="card mb-5">
      <h3 style={{ margin: '0 0 14px' }}>
        Welkom! Laten we je eerst wat uitleg geven over het platform.
      </h3>
      <div
        style={{
          borderRadius: 'var(--radius-sm)',
          height: 0,
          overflow: 'hidden',
          paddingBottom: '56.25%',
          position: 'relative',
        }}
      >
        <iframe
          allow="fullscreen; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          src={WELCOME_VIDEO_URL}
          style={{
            border: 0,
            height: '100%',
            inset: 0,
            position: 'absolute',
            width: '100%',
          }}
          title="Osago — introductievideo"
        />
      </div>
    </div>
  )
}
