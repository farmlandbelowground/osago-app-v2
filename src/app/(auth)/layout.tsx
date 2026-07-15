import { type ReactNode } from 'react'

import { Logo } from '@shared/components/Logo'

interface Props {
  children: ReactNode
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className={`
      grid min-h-screen
      min-[901px]:grid-cols-2
    `}>
      <div
        className={`
          relative hidden flex-col justify-between overflow-hidden
          bg-[linear-gradient(135deg,#0a1f14_0%,#1f3328_100%)] p-12 text-white
          before:pointer-events-none before:absolute before:-top-[200px]
          before:-right-[200px] before:h-[500px] before:w-[500px]
          before:bg-[radial-gradient(circle,rgba(0,179,60,0.25)_0%,transparent_70%)]
          before:content-['']
          after:pointer-events-none after:absolute after:-bottom-[150px]
          after:-left-[100px] after:h-[400px] after:w-[400px]
          after:bg-[radial-gradient(circle,rgba(0,179,60,0.15)_0%,transparent_70%)]
          after:content-['']
          min-[901px]:flex
        `}
      >
        <Logo className="relative z-10 h-[34px] w-[106px]" inverted />

        <div className="relative z-10">
          <h1 className={`
            mb-5 font-serif text-[48px] leading-[1.1] font-medium
            tracking-[-0.02em]
          `}>
            Verkoop jouw bedrijf <br /> met <em className="text-primary">onze hulp</em>
          </h1>
          <p className="max-w-[440px] text-[17px] leading-[1.6] opacity-[0.78]">
            Osago begeleidt ondernemers stap voor stap door het complexe
            verkoopproces — van waardebepaling tot deal closing. Met de
            juiste tools, documenten en expertise.
          </p>
        </div>

        <blockquote
          className={`
            relative z-10 max-w-[440px] border-l-[3px] border-primary py-2 pl-5
            text-[15px] italic opacity-[0.82]
          `}
        >
          &quot;Na 22 jaar bouwen aan mijn bedrijf, was Osago de perfecte
          partner om de verkoop in goede banen te leiden. Professioneel,
          transparant en boven verwachting.&quot;
          <footer className="mt-2 text-[13px] not-italic opacity-70">
            — Henk Vermeulen, oud-eigenaar Vermeulen Logistiek
          </footer>
        </blockquote>
      </div>

      <div className="flex flex-col justify-center bg-surface p-12">
        <div className="mx-auto w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  )
}
