import { type Lead } from '../../types'

export interface SalesDocumentContext {
  buyer: Lead
  company: { city: string; kvkNummer: string | null; name: string }
  seller: { email: string; signatory: string }
  today: string
}

// Ports legacy's escape() (osago-bundle.js:3155-3158). These builders emit a raw
// HTML string (a Word-compatible .doc), so interpolated values must be escaped
// by hand — React is not rendering this.
export const escapeHtml = (value: string | null | undefined): string => {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).replace(
    /[&<>"']/g,
    character =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] ?? character,
  )
}

// Ports the inline safeName() used in every doGenerate* (osago-bundle.js:22121).
export const safeFileName = (value: string): string =>
  value
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

// Buyer address block — ports the buyerAddrParts assembly shared by all three
// documents (osago-bundle.js:21931-21939 / 22238-22245 / 22527-22534).
export const buildBuyerAddress = (
  buyer: Lead,
  includeCountry: boolean,
): string => {
  const parts: string[] = []
  if (buyer.street || buyer.houseNumber) {
    parts.push(
      [buyer.street, buyer.houseNumber, buyer.houseNumberAddition]
        .filter(Boolean)
        .join(' '),
    )
  }
  if (buyer.postalCode || buyer.city) {
    parts.push([buyer.postalCode, buyer.city].filter(Boolean).join(' '))
  }
  if (includeCountry && buyer.country) {
    parts.push(buyer.country)
  }
  return parts.join(', ')
}

export const buyerContactName = (buyer: Lead): string =>
  [buyer.contactFirstName, buyer.contactLastName].filter(Boolean).join(' ') ||
  buyer.contactLegacy ||
  ''
