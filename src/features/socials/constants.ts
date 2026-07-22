import { type SocialsPlatform, type SocialsPlatformSpec } from './types'

export const ADMIN_SOCIALS_GENERATOR_PATH = '/admin/socials-generator'

export const SOCIALS_MAX_TOKENS = 1500
export const COPY_CLEAR_MS = 2000

export const OPACITY_DIMMED = 0.3
export const OPACITY_DISABLED_SOFT = 0.7
export const CAROUSEL_DOT_ACTIVE_WIDTH = 18
export const CAROUSEL_DOT_WIDTH = 4

export const SOCIALS_PLATFORMS: readonly SocialsPlatform[] = [
  'instagram',
  'linkedin',
  'facebook',
]

export const SOCIALS_PLATFORM_SPECS: Record<
  SocialsPlatform,
  SocialsPlatformSpec
> = {
  facebook: { h: 630, label: '1200×630', name: 'Facebook', ratio: '1.91:1', w: 1200 },
  instagram: { h: 1350, label: '1080×1350', name: 'Instagram', ratio: '4:5', w: 1080 },
  linkedin: { h: 627, label: '1200×627', name: 'LinkedIn', ratio: '1.91:1', w: 1200 },
}

export const SOCIALS_BRAND = {
  accent: '#22c55e',
  accentHover: '#16a34a',
  bg: '#ffffff',
  bgSoft: '#f8fafc',
  border: '#e2e8f0',
  greenDarker: '#062920',
  greenDeep: '#0a3d2e',
  greenLight: '#d1fae5',
  ink: '#0f172a',
  inkMuted: '#94a3b8',
  inkSoft: '#475569',
  mint: '#86efac',
} as const

export const SOCIALS_ILLUSTRATIONS = [
  {
    file: 'bedrijfsbezoek.svg',
    hint: "voor 'Hoe het werkt'-onderwerpen",
    story: 'Proces in actie',
  },
  {
    file: 'contract-tekenen.svg',
    hint: 'voor prijzen, deals, afronden',
    story: 'Overeenkomst formaliseren',
  },
  {
    file: 'meeting.svg',
    hint: 'voor FAQ, onboarding, contact',
    story: 'Gesprek voeren, vragen stellen',
  },
  {
    file: 'koffie-drinken.svg',
    hint: "voor 'Waarom Osago', team, verhaal",
    story: 'Persoonlijk, mensen achter Osago',
  },
  {
    file: 'waardering.svg',
    hint: 'voor bedrijfswaarderingen',
    story: 'Onderbouwd waarde-bepalen',
  },
] as const

export const SOCIALS_ANGLE_OPTIONS: readonly (readonly [string, string])[] = [
  ['', '— Kies een invalshoek —'],
  ['Self-service: jij houdt zelf de regie', 'Self-service · jij houdt regie'],
  ['Geen succesfee, vaste lage prijs vanaf €999', 'Geen succesfee · €999'],
  ['Hoe het werkt: het 6-stappen proces', 'Hoe het werkt · 6 stappen'],
  [
    'Bedrijfswaardering: weet wat je bedrijf waard is',
    'Bedrijfswaardering',
  ],
  ['Klantverhaal / case study', 'Klantverhaal'],
  ['Mythes over bedrijfsverkoop ontkracht', 'Mythe ontkrachten'],
  ['Veelgemaakte fout bij bedrijf verkopen', 'Veelgemaakte fout'],
  ['Tips ter voorbereiding op de verkoop', 'Voorbereidings-tips'],
]

export const SOCIALS_TONE_OPTIONS: readonly (readonly [string, string])[] = [
  ['informeel-helder', 'Informeel en helder'],
  ['ondernemend-no-nonsense', 'Ondernemend · no-nonsense'],
  ['warm-vertrouwd', 'Warm en vertrouwd'],
  ['educatief-uitleggend', 'Educatief / uitleggend'],
  ['urgent-actiegericht', 'Urgent · actiegericht'],
]

export const SOCIALS_AUDIENCE_OPTIONS: readonly (readonly [string, string])[] = [
  ['MKB-ondernemers (€0-2.5M omzet)', 'MKB-ondernemers (€0-2.5M)'],
  ["DGA's die willen verkopen", "DGA's die willen verkopen"],
  ['Ondernemers die over 2-5 jaar willen verkopen', 'Verkoop over 2-5 jaar'],
  ['Ondernemers die nu willen verkopen', 'Verkoop op korte termijn'],
  ['Bedrijfsovernemers / kopers', 'Bedrijfsovernemers'],
  ['Boekhouders / accountants als verwijzers', 'Boekhouders / accountants'],
]

export const SOCIALS_DEFAULT_TONE = 'informeel-helder'
export const SOCIALS_DEFAULT_AUDIENCE = 'MKB-ondernemers (€0-2.5M omzet)'

// Brand palette emitted as `--sg-*` CSS custom properties on the root
// (osago-bundle.js:28021).
export const SOCIALS_BRAND_VARS: Record<string, string> = Object.fromEntries(
  Object.entries(SOCIALS_BRAND).map(([key, value]) => [`--sg-${key}`, value]),
)
