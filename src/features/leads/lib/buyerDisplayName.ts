import { type Lead } from '../types'

// Ports buyerDisplayName (osago-bundle.js:3363-3370): company name, falling back
// to the contact's full name when there is no registered company.
export const buyerDisplayName = (lead: Lead): string => {
  if (lead.name && lead.name.trim()) {
    return lead.name
  }
  const full =
    `${lead.contactFirstName ?? ''} ${lead.contactLastName ?? ''}`.trim()
  return full || '—'
}
