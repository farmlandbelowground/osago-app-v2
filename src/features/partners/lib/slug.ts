import {
  SLUG_FALLBACK,
  SLUG_MAX_LENGTH,
  SLUG_UNIQUE_START_INDEX,
} from '../constants'

interface SlugCandidate {
  id: string
  slug: string
}

// Ported verbatim from legacy slugifyPartnerName (osago-bundle.js:12764). The
// character class ̀-ͯ is the combining-diacritics range legacy strips
// after NFD normalisation (its source used the literal combining marks).
export const slugifyPartnerName = (name: string): string => {
  if (!name) {
    return ''
  }

  return String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, '-en-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
}

// Ported from legacy ensureUniquePartnerSlug (osago-bundle.js:12774); the
// partner list is passed in rather than read from a global db, matching the
// features/appointments precedent.
export const ensureUniquePartnerSlug = (
  base: string,
  excludeId: string | null,
  existingPartners: readonly SlugCandidate[],
): string => {
  let slug = base || SLUG_FALLBACK
  let n = SLUG_UNIQUE_START_INDEX

  while (
    existingPartners.some(
      partner => partner.id !== excludeId && partner.slug === slug,
    )
  ) {
    slug = `${base}-${n}`
    n += 1
  }

  return slug
}
