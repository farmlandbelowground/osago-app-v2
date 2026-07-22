import {
  AbonnementenIcon,
  AfsprakenInstellingenIcon,
  DashboardIcon,
  DocumentenkluisIcon,
  FacturatieIcon,
  FinancieleGegevensIcon,
  GeboekteAfsprakenIcon,
  KlantenIcon,
  KopermatchingIcon,
  MailtemplatesIcon,
  MedewerkersIcon,
  MijnBedrijfIcon,
  PartnersIcon,
  PresentatieIcon,
  ProjectenIcon,
  SocialsGeneratorIcon,
  ValuationIcon,
  ValueDriversIcon,
  VerkoopklaarMakenIcon,
  VerkoopprocesIcon,
  VouchersIcon,
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

// Medewerker-only "In ontwikkeling" section (index.html:309-316). Rendered by
// the customer Sidebar only while an Osago employee is impersonating; a real
// customer never sees it. Ports legacy's data-medewerker-only nav section.
export const MEDEWERKER_NAV_SECTION: NavSection = {
  links: [
    {
      href: '/verkoopklaar-maken',
      icon: VerkoopklaarMakenIcon,
      label: 'Verkoopklaar maken',
    },
  ],
  title: 'In ontwikkeling',
}

export const NAV_ICON_SIZE_PX = 18
export const USER_AVATAR_SIZE_PX = 36
export const FOOTER_ICON_SIZE_PX = 16

export const ADMIN_ACCOUNT_PATH = '/admin/account'

// Matches legacy's #admin-app sidebar structure (index.html) exactly — same
// .sidebar/.nav-item/.nav-section classes as the customer sidebar, per
// styles.css. The "Beheer" section is hidden entirely for `admin_user`
// sessions (ADMIN_RESTRICTED_PAGES in osago-bundle.js gates every one of its
// links to the full `admin` role). Routes not yet built by a later slice
// still render here for visual/nav parity — they 404 until that slice
// lands, same as the customer sidebar's own mid-migration shell.
export const ADMIN_NAV_SECTIONS: readonly NavSection[] = [
  {
    links: [
      { href: '/admin/dashboard', icon: DashboardIcon, label: 'Overzicht' },
      { href: '/admin/klanten', icon: KlantenIcon, label: 'Klanten' },
      { href: '/admin/projecten', icon: ProjectenIcon, label: 'Projecten' },
      {
        href: '/admin/abonnementen',
        icon: AbonnementenIcon,
        label: 'Abonnementen',
      },
      { href: '/admin/facturen', icon: FacturatieIcon, label: 'Facturatie' },
      {
        href: '/admin/afspraken',
        icon: GeboekteAfsprakenIcon,
        label: 'Geboekte afspraken',
      },
    ],
    title: 'Operationeel',
  },
  {
    links: [
      { href: '/admin/vouchers', icon: VouchersIcon, label: 'Vouchers' },
      { href: '/admin/partners', icon: PartnersIcon, label: 'Partners' },
      {
        href: '/admin/afspraken-instellingen',
        icon: AfsprakenInstellingenIcon,
        label: 'Afspraaktypen',
      },
      {
        href: '/admin/medewerker',
        icon: MedewerkersIcon,
        label: 'Medewerkers',
      },
      {
        href: '/admin/mailtemplates',
        icon: MailtemplatesIcon,
        label: 'Email templates',
      },
      {
        href: '/admin/valuation-instellingen',
        icon: ValuationIcon,
        label: 'Valuation',
      },
      {
        href: '/admin/socials-generator',
        icon: SocialsGeneratorIcon,
        label: 'Socials generator',
      },
    ],
    requiresFullAdmin: true,
    title: 'Beheer',
  },
] as const satisfies readonly NavSection[]
