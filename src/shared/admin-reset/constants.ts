import { type AdminResetConfigEntry, type AdminResetType } from './types'

// Ported verbatim from legacy ADMIN_RESET_CONFIG / ADMIN_RESET_FEE
// (osago-bundle.js:12514-12574).
export const ADMIN_RESET_FEE = 199
export const ADMIN_RESET_PAYMENT_TERM_DAYS = 14
export const SALES_INVOICE_CREATE_ENDPOINT = '/api/mollie/sales-invoice/create'

export const ADMIN_RESET_CONFIG: Record<AdminResetType, AdminResetConfigEntry> =
  {
    anoniem: {
      invoiceLine: 'Nieuwe versie anoniem verkoopprofiel',
      message:
        'Het anoniem verkoopprofiel wordt uit de Documentenkluis verwijderd. De klant kan vervolgens opnieuw een anoniem profiel laten genereren.',
      successToast: 'Anoniem verkoopprofiel verwijderd uit de Documentenkluis.',
      title: 'Anoniem verkoopprofiel resetten',
    },
    memorandum: {
      invoiceLine: 'Nieuwe versie verkoopmemorandum',
      message:
        'Het verkoopmemorandum wordt uit de Documentenkluis verwijderd. De klant kan vervolgens opnieuw een memorandum laten genereren.',
      successToast: 'Verkoopmemorandum verwijderd uit de Documentenkluis.',
      title: 'Verkoopmemorandum resetten',
    },
    valuation: {
      invoiceLine: 'Nieuwe versie waardebepaling',
      message:
        'De vastgelegde waardering wordt gewist. De klant kan daarna zelf opnieuw op Waardering maken klikken.',
      successToast: 'Waardering gereset.',
      title: 'Waardering resetten',
    },
    valuationPdf: {
      invoiceLine: 'Nieuwe versie waarderingsrapport',
      message:
        'Het waarderingsrapport-PDF wordt uit de Documentenkluis verwijderd. De klant kan vervolgens opnieuw "Maak waarderingsrapport" klikken.',
      successToast: 'Waarderingsrapport-PDF verwijderd uit de Documentenkluis.',
      title: 'Waarderingsrapport-PDF resetten',
    },
    verbeterrapport: {
      invoiceLine: 'Nieuwe versie verbeterrapport',
      message:
        'Het verbeterrapport (Verkoopklaar maken) wordt uit de Documentenkluis verwijderd. De klant kan vervolgens opnieuw een nieuw verbeterrapport laten genereren.',
      successToast: 'Verbeterrapport verwijderd uit de Documentenkluis.',
      title: 'Verbeterrapport resetten',
    },
  }
