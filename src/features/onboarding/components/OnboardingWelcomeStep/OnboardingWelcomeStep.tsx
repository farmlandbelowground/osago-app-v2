import { type FC } from 'react'

export const OnboardingWelcomeStep: FC = () => (
  <div className="card" style={{ maxWidth: 720, margin: '0 auto', padding: '40px 48px' }}>
    <h1
      className="serif"
      style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.15, margin: '0 0 14px' }}
    >
      Welkom bij Osago
    </h1>
    <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.65, margin: '0 0 20px' }}>
      We gaan je stap voor stap meenemen bij het aanmaken van je account,
      zodat je daarna een vliegende start kunt maken.
    </p>

    <div
      style={{
        borderRadius: 'var(--radius-sm)',
        height: 0,
        margin: '24px 0',
        overflow: 'hidden',
        paddingBottom: '56.25%',
        position: 'relative',
      }}
    >
      <iframe
        allow="fullscreen; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
        src="https://www.loom.com/embed/99908d22cffc4d918f969cd74ea55f1d"
        style={{ border: 0, height: '100%', inset: 0, position: 'absolute', width: '100%' }}
        title="Osago — welkomstvideo"
      />
    </div>

    <div
      style={{
        background: 'var(--line-soft)',
        borderRadius: 'var(--radius-sm)',
        margin: '24px 0',
        padding: '20px 22px',
      }}
    >
      <p
        style={{
          color: 'var(--ink)',
          fontSize: '13.5px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          margin: '0 0 8px',
          textTransform: 'uppercase',
        }}
      >
        Wat ga je doen?
      </p>
      <ul
        style={{
          color: 'var(--ink-2)',
          fontSize: 14,
          lineHeight: 1.75,
          listStyleType: 'disc',
          margin: 0,
          paddingLeft: 20,
        }}
      >
        <li>Bedrijfsprofiel invullen via Kamer van Koophandel</li>
        <li>Een passend abonnement kiezen om aan de slag te gaan</li>
      </ul>
    </div>

    <p style={{ color: 'var(--muted)', fontSize: '13.5px', margin: 0 }}>
      Klik op <strong>Volgende</strong> rechtsonder om te starten.
    </p>
  </div>
)
