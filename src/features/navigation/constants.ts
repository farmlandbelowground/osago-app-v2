import {
  DashboardIcon,
  DocumentenkluisIcon,
  FinancieleGegevensIcon,
  KopermatchingIcon,
  MijnBedrijfIcon,
  PresentatieIcon,
  ValueDriversIcon,
  VerkoopprocesIcon,
  WaardebepalingIcon,
  WaarderingsrapportIcon,
} from './assets/icons'
import { type NavSection } from './types'

// Matches legacy's #customer-app sidebar structure (index.html) exactly.
// Routes not yet built by a later slice still render here for visual/nav
// parity — they 404 until that slice lands, same as any mid-migration shell.
export const NAV_SECTIONS: readonly NavSection[] = [
  {
    links: [{ href: '/dashboard', icon: DashboardIcon, label: 'Dashboard' }],
  },
  {
    links: [
      {
        href: '/verkooppresentatie',
        icon: PresentatieIcon,
        label: 'Presentatie',
      },
      {
        href: '/kopermatching',
        icon: KopermatchingIcon,
        label: 'Kopermatching',
      },
      {
        href: '/verkoopproces',
        icon: VerkoopprocesIcon,
        label: 'Verkoopproces',
      },
    ],
    title: 'Overname',
  },
  {
    links: [
      {
        href: '/waardebepaling',
        icon: WaardebepalingIcon,
        label: 'Waardebepaling',
      },
      {
        href: '/financiele-gegevens',
        icon: FinancieleGegevensIcon,
        label: 'Financiële gegevens',
      },
      {
        href: '/value-drivers',
        icon: ValueDriversIcon,
        label: 'Value drivers',
      },
      {
        href: '/waarderingsrapport',
        icon: WaarderingsrapportIcon,
        label: 'Waarderingsrapport',
      },
    ],
    title: 'Waarde',
  },
  {
    links: [
      { href: '/mijn-bedrijf', icon: MijnBedrijfIcon, label: 'Mijn bedrijf' },
      {
        href: '/documentenkluis',
        icon: DocumentenkluisIcon,
        label: 'Documentenkluis',
      },
    ],
    title: 'Bedrijf',
  },
] as const satisfies readonly NavSection[]

export const NAV_ICON_SIZE_PX = 18
export const USER_AVATAR_SIZE_PX = 36
export const FOOTER_ICON_SIZE_PX = 16
