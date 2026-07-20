import { type ReactNode } from 'react'

import { Logo } from '@shared/components/Logo'

interface Props {
  children: ReactNode
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className="auth-wrap">
      <div className="auth-side">
        <Logo />

        <div className="auth-hero">
          <h1>
            Verkoop jouw bedrijf <br /> met <em>onze hulp</em>
          </h1>
          <p>
            Osago begeleidt ondernemers stap voor stap door het complexe
            verkoopproces — van waardebepaling tot deal closing. Met de
            juiste tools, documenten en expertise.
          </p>
        </div>

        <blockquote className="auth-quote">
          &quot;Na 22 jaar bouwen aan mijn bedrijf, was Osago de perfecte
          partner om de verkoop in goede banen te leiden. Professioneel,
          transparant en boven verwachting.&quot;
          <footer className="who">
            — Henk Vermeulen, oud-eigenaar Vermeulen Logistiek
          </footer>
        </blockquote>
      </div>

      <div className="auth-form">
        <div className="auth-form-inner">{children}</div>
      </div>
    </div>
  )
}
