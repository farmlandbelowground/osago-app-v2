import { PARTNER_PATH } from '../constants'

// Ports legacy buildPartnerRegistrationUrl (osago-bundle.js:12795) as the
// App-Router path form (`/partner/<slug>`); legacy's hash form (`/#partner/…`)
// is dropped per spec §4 D-3. `origin` is passed in (from
// window.location.origin at the call site) so the helper stays pure and
// SSR-safe rather than reading a browser global.
export const buildPartnerRegistrationUrl = (
  slug: string,
  origin: string,
): string => {
  if (!slug) {
    return ''
  }

  return `${origin}${PARTNER_PATH}/${slug}`
}
