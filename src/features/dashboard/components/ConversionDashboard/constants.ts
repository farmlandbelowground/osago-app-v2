import { type ReactNode } from 'react'

// USPs from the mockup — dark-green panel at the bottom of the conversion
// dashboard. Icons are inline SVG so the file stays self-contained.

const SearchIcon = (
  <svg fill="none" height="17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="17">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)
const CoinIcon = (
  <svg fill="none" height="17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="17">
    <path d="M19 5a8 8 0 1 0 0 14" />
    <path d="M3 10h11" />
    <path d="M3 14h11" />
  </svg>
)
const DocIcon = (
  <svg fill="none" height="17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="17">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
)
const UserIcon = (
  <svg fill="none" height="17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="17">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)
const BoardIcon = (
  <svg fill="none" height="17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="17">
    <rect height="18" rx="1" width="7" x="3" y="3" />
    <rect height="11" rx="1" width="7" x="14" y="3" />
  </svg>
)
const StarIcon = (
  <svg fill="none" height="17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="17">
    <path d="M12 2 15 8h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z" />
  </svg>
)

export interface Usp {
  desc: string
  icon: ReactNode
  title: string
}

export const USPS: readonly Usp[] = [
  {
    desc: 'Wij zoeken actief mee en brengen je in contact met minimaal 3 tot 5 serieus geïnteresseerde partijen.',
    icon: SearchIcon,
    title: 'Kopers uit ons netwerk',
  },
  {
    desc: 'Een onderbouwde waardebepaling op basis van de EBITDA-multiple methode en actuele transactieprijzen uit jouw sector.',
    icon: CoinIcon,
    title: 'Weet wat je bedrijf waard is',
  },
  {
    desc: 'Genereer je NDA, teaser, informatiememorandum, LOI en verkoopcontract rechtstreeks vanuit het platform.',
    icon: DocIcon,
    title: 'Alle documenten kant-en-klaar',
  },
  {
    desc: 'Vanaf Plus krijg je een vast aanspreekpunt dat je door het hele traject begeleidt.',
    icon: UserIcon,
    title: 'Een eigen contactpersoon',
  },
  {
    desc: 'Volg elke koper door de fasen van je verkoopproces, met per stap uitleg over wat je moet doen.',
    icon: BoardIcon,
    title: 'Overzicht tot aan de deal',
  },
  {
    desc: 'Met Premium plaatsen we jouw profiel ook op Brookz.nl en Bedrijventekoop.nl.',
    icon: StarIcon,
    title: 'Extra zichtbaarheid',
  },
]

export const CONVERSION_FOOTNOTE =
  '* Hulp bestaat uit ondersteuning via ons platform en onze templates. ** Osago spant zich in om dit aantal serieus geïnteresseerden te bereiken binnen de looptijd van je abonnement.'
