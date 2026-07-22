import {
  SLUG_FALLBACK,
  SLUG_MAX_LENGTH,
  SLUG_UNIQUE_START_INDEX,
} from '../constants'

interface SlugCandidate {
  id: string
  slug: string
}

export const slugifyAppointmentName = (name: string): string => {
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

export const ensureUniqueAppointmentSlug = (
  base: string,
  excludeId: string | null,
  existingTypes: readonly SlugCandidate[],
): string => {
  let slug = base || SLUG_FALLBACK
  let n = SLUG_UNIQUE_START_INDEX

  while (
    existingTypes.some(type => type.id !== excludeId && type.slug === slug)
  ) {
    slug = `${base}-${n}`
    n += 1
  }

  return slug
}
