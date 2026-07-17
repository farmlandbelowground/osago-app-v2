import {
  type BadgeKind,
  type InvoiceFilterPreset,
  type Plan,
  type SubscriptionStatus,
  type VoucherStatus,
} from './types'

export const ACCOUNT_PATH = '/account'
export const ABONNEMENT_AFSLUITEN_PATH = '/abonnement-afsluiten'
export const ADMIN_ABONNEMENTEN_PATH = '/admin/abonnementen'
export const ADMIN_FACTUREN_PATH = '/admin/facturen'
export const ADMIN_FACTUREN_EXPORT_PATH = '/admin/facturen/export'
export const ADMIN_VOUCHERS_PATH = '/admin/vouchers'

export const SUBSCRIPTION_CREATE_PAYMENT_ENDPOINT =
  '/api/mollie/subscription/create-payment'
export const SUBSCRIPTION_RETURN_ENDPOINT = '/api/mollie/subscription/return'
export const SALES_INVOICE_RECONCILE_ENDPOINT =
  '/api/mollie/sales-invoice/reconcile'
export const SALES_INVOICE_CREATE_ENDPOINT = '/api/mollie/sales-invoice/create'
export const SALES_INVOICE_LIST_ENDPOINT = '/api/mollie/sales-invoice/list'
export const SALES_INVOICE_DELETE_ENDPOINT = '/api/mollie/sales-invoice/delete'

export const SUBSCRIPTION_TAG = 'subscription'
export const INVOICES_TAG = 'invoices'
export const VOUCHERS_TAG = 'vouchers'

export const VAT_RATE = 0.21
export const VAT_PERCENTAGE = 21
export const VOUCHER_PERCENTAGE_MAX = 100
export const SUBSCRIPTION_DURATION_MONTHS = 6
export const SUBSCRIPTION_RENEW_NOTICE_DAYS = 30
export const CANCEL_WARNING_WINDOW_DAYS = 14
export const DAY_MS = 86_400_000
export const CENTS_PER_UNIT = 100

export const MONTHS_PER_QUARTER = 3
export const LAST_MONTH_INDEX = 11
export const LAST_DAY_OF_DECEMBER = 31
export const END_OF_DAY_HOURS = 23
export const END_OF_DAY_MINUTES = 59
export const END_OF_DAY_SECONDS = 59
export const END_OF_DAY_MS = 999

// Exact Online accounting codes — see slice-03 spec §5 Decision 9, ported
// verbatim from osago-bundle.js's exportInvoicesToExcel.
export const XLS_DAGBOEK_CODE = 70
export const XLS_BETALINGSCONDITIE_CODE = 91
export const XLS_GROOTBOEKREKENING_CODE = 1_300
export const XLS_BTW_CODE = 2
export const XLS_QUANTITY = 1
export const XLS_SHEET_NAME = 'Gegevens'
export const XLS_MIME_TYPE = 'application/vnd.ms-excel'
export const XLS_FILENAME_PREFIX = 'Facturen_export_'

export const XLS_HEADERS = [
  'Dagboek: Code',
  'Boekjaar',
  'Periode',
  'Boekstuknummer',
  'Omschrijving: Kopregel',
  'Factuurdatum',
  'Vervaldatum',
  'Betalingsconditie: Code',
  'Ordernummer',
  'Code',
  'Naam',
  'Grootboekrekening',
  'Omschrijving',
  'BTW-code',
  'BTW-percentage',
  'Bedrag',
  'Aantal',
  'BTW-bedrag',
] as const

export const PLAN_IDS = [
  'basic',
  'plus',
  'premium',
  'valuation-basic',
  'valuation-premium',
] as const

export const VOUCHER_APPLIES_TO_ALL = 'all'

// Ports legacy's subStatus() label/badge mapping (osago-bundle.js:12684).
export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Actief',
  ending: 'Loopt binnenkort af',
  expired: 'Verlopen',
  none: 'Geen abonnement',
  renewed: 'Wordt verlengd',
}

// Ports legacy's .badge-* color pairs verbatim (styles.css ~1474-1491).
export const BADGE_KIND_CLASSES: Record<BadgeKind, string> = {
  danger: 'bg-[#FEE2E2] text-[#991B1B]',
  info: 'bg-[#E0F2FE] text-[#0369A1]',
  neutral: 'bg-[#F3F4F6] text-[#4B5563]',
  success: 'bg-primary-soft text-primary-hover',
  warning: 'bg-[#FEF3C7] text-[#92400E]',
}

// Ports legacy's base .badge shape verbatim (styles.css ~1474-1483) — pill,
// no border, uppercase 11px/600.
export const BADGE_SHAPE_CLASSES =
  'inline-flex items-center gap-[5px] rounded-full px-2.5 py-[3px] text-[11px] font-semibold tracking-[0.03em] uppercase'

export const SUBSCRIPTION_STATUS_KIND: Record<SubscriptionStatus, BadgeKind> = {
  active: 'success',
  ending: 'warning',
  expired: 'danger',
  none: 'neutral',
  renewed: 'info',
}

// Statuses counted toward the admin abonnementen KPI's revenue tile.
export const SUBSCRIPTION_ARR_STATUSES: readonly SubscriptionStatus[] = [
  'active',
  'ending',
  'renewed',
]

export const INVOICE_FILTER_PRESET_LABELS: Record<InvoiceFilterPreset, string> =
  {
    all: 'Alles',
    custom: 'Aangepast',
    month: 'Deze maand',
    quarter: 'Dit kwartaal',
    year: 'Dit jaar',
  }

export const INVOICE_FILTER_PRESET_OPTIONS: readonly InvoiceFilterPreset[] = [
  'all',
  'month',
  'quarter',
  'year',
  'custom',
]

export const VOUCHER_STATUS_LABELS: Record<VoucherStatus, string> = {
  active: 'Actief',
  deactivated: 'Gedeactiveerd',
  depleted: 'Opgebruikt',
  expired: 'Verlopen',
  notYetValid: 'Nog niet geldig',
}

export const VOUCHER_STATUS_KIND: Record<VoucherStatus, BadgeKind> = {
  active: 'success',
  deactivated: 'neutral',
  depleted: 'warning',
  expired: 'danger',
  notYetValid: 'info',
}

export const PAYMENT_TERM_DAYS_OPTIONS = [7, 14, 30, 60, 90, 120] as const
export const DEFAULT_PAYMENT_TERM_DAYS = 14
export const MANUAL_INVOICE_LINE_ITEM_STEP = 0.01

// Mirrors the frozen backend's duplicated PLANS table (create-payment.js /
// sales-invoice/create.js) — see slice-03 spec §5 Decision 3. Copy verbatim
// from osago-bundle.js:12125-12204.
export const PLANS: readonly Plan[] = [
  {
    category: 'full',
    ctaLabel: 'Kies Basis',
    desc: 'Voor de zelfstandige doener',
    features: [
      { included: true, text: 'Hulp bij het maken van de teaser*' },
      {
        included: true,
        text: 'Hulp bij het maken van het informatiememorandum*',
      },
      { included: true, text: 'Hulp bij de waardebepaling*' },
      { included: true, text: 'Minimaal 3 serieus geïnteresseerden**' },
      { included: true, text: 'Geheimhoudingsverklaring generator' },
      { included: true, text: 'Template LOI' },
      { included: true, text: 'Template verkoopcontract' },
      { included: true, text: 'Looptijd 6 maanden' },
      { included: true, text: 'Wisselende contactpersoon' },
    ],
    id: 'basic',
    label: 'Basis',
    price: 999,
    priceMeta: 'excl. btw',
  },
  {
    category: 'full',
    ctaLabel: 'Kies Plus',
    desc: 'Voor de ondernemer die guidance wil',
    featured: true,
    features: [
      { included: true, text: 'Hulp bij het maken van de teaser*' },
      { included: true, text: 'Controle en publicatie van de teaser' },
      {
        included: true,
        text: 'Hulp bij het maken van het informatiememorandum*',
      },
      {
        included: true,
        text: 'Controle en publicatie van het informatiememorandum',
      },
      { included: true, text: 'Hulp bij de waardebepaling*' },
      { included: true, text: 'Minimaal 5 serieus geïnteresseerden**' },
      { included: true, text: 'Geheimhoudingsverklaring generator' },
      { included: true, text: 'Template LOI en verkoopcontract' },
      { included: true, text: '2 uur juridisch advies bij dealafwikkeling' },
      { included: true, text: 'Looptijd 6 maanden' },
      { included: true, text: 'Eigen contactpersoon' },
    ],
    id: 'plus',
    label: 'Plus',
    price: 1_799,
    priceMeta: 'excl. btw',
  },
  {
    category: 'full',
    ctaLabel: 'Kies Premium',
    desc: 'Voor maximale zichtbaarheid',
    features: [
      { included: true, text: 'Alles uit Plus' },
      {
        included: true,
        text: 'Plaatsing van jouw profiel op Brookz.nl en Bedrijventekoop.nl',
      },
      { included: true, text: 'Minimaal 5 serieus geïnteresseerden**' },
      {
        included: true,
        text: 'Volledige controle en publicatie van teaser en memorandum',
      },
      { included: true, text: '2 uur juridisch advies bij dealafwikkeling' },
      { included: true, text: 'Eigen contactpersoon' },
      { included: true, text: 'Looptijd 6 maanden' },
    ],
    id: 'premium',
    label: 'Premium',
    price: 2_499,
    priceMeta: 'excl. btw',
  },
  {
    cardLabel: 'Basis',
    category: 'valuation',
    ctaLabel: 'Start Basis-waardering',
    desc: 'Waardering middels onze tool',
    features: [
      {
        included: true,
        text: 'Uitgebreide bedrijfswaardering o.b.v. EBITDA-multiple methode',
      },
      { included: true, text: "Rapport van 18 pagina's (PDF)" },
      { included: true, text: 'Inzicht in de bedrijfswaarde' },
      { included: true, text: 'Waardeverhogende tips' },
      { included: true, text: 'Actuele transactieprijzen uit jouw sector' },
      { included: true, text: 'Volledig self-service via ons platform' },
    ],
    id: 'valuation-basic',
    label: 'Waardebepaling Basis',
    price: 299,
    priceMeta: 'eenmalig, excl. btw',
  },
  {
    cardLabel: 'Premium',
    category: 'valuation',
    ctaLabel: 'Start Premium-waardering',
    desc: 'Waardering met controle door een valuator',
    featured: true,
    features: [
      { included: true, text: 'Alles uit Basis' },
      {
        included: true,
        text: 'Uitgebreide bedrijfswaardering o.b.v. EBITDA-multiple methode',
      },
      {
        included: true,
        text: 'Controle door een ervaren business valuator',
      },
      { included: true, text: 'Persoonlijke toelichting op het rapport' },
      { included: true, text: 'Validatie van jouw input en aannames' },
      { included: true, text: 'Antwoord op jouw waarderingsvragen' },
    ],
    id: 'valuation-premium',
    label: 'Waardebepaling Premium',
    price: 1_499,
    priceMeta: 'eenmalig, excl. btw',
  },
] as const satisfies readonly Plan[]

export const MIN_PLAN_PRICE = Math.min(...PLANS.map(plan => plan.price))
