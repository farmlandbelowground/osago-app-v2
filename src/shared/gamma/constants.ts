// Shared Gamma orchestration — the generate → poll → download → vault flow used
// by both the presentation memorandum/teaser (features/presentation) and the
// valuation report (features/valuation). Ports the timing + endpoints from
// legacy generateViaGamma / generateValuationViaGamma (osago-bundle.js:19705+).

export const GAMMA_GENERATE_ENDPOINT = '/api/gamma/generate'
export const GAMMA_STATUS_ENDPOINT = '/api/gamma/status'
export const GAMMA_DOWNLOAD_ENDPOINT = '/api/gamma/download'

// Poll every 5s, time out at 5 min — legacy generateViaGamma (:19740-19759).
export const GAMMA_POLL_INTERVAL_MS = 5000
export const GAMMA_TIMEOUT_MS = 5 * 60 * 1000

export const GAMMA_STATUS_QUERY_KEY = 'gamma-status'

// Editable PowerPoint MIME — the vault write's fileType (legacy :19775).
export const PPTX_MIME =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'

// PDF MIME — the vault write's fileType for the fixed-template flow (#65: all
// documents become non-editable PDF, injected with the app's own photos/charts).
export const PDF_MIME = 'application/pdf'

// Fixed colofon/disclaimer embedded in every generated document
// (osago-bundle.js OSAGO_COLOFON_TEKST :19566-19570). Lives here (not in a
// feature) because both prompt builders use it — a feature-to-feature import
// would be circular (presentation already depends on valuation).
export const OSAGO_COLOFON_TEKST =
  'Dit document is door de aanbieder zelf opgesteld met behulp van het Osago-platform. ' +
  'De aanbieder voert het verkoopproces te allen tijde zelf en is verantwoordelijk voor de inhoud van dit document. ' +
  'Osago is geen partij bij, en geen begeleider of adviseur van, de (voorgenomen) transactie en aanvaardt geen aansprakelijkheid voor de inhoud. ' +
  'Aan dit document kunnen geen rechten worden ontleend.'

// Legacy surfaced the server's raw error; the frozen endpoint returns a flat
// `{ error }` (not the shared `{ error: { message } }` shape), so v2 falls back
// to a generic message on start failures (spec §3.2).
export const GAMMA_GENERIC_ERROR =
  'Genereren mislukt. Probeer het later opnieuw.'
export const GAMMA_FAILED_ERROR = 'Gamma-generatie mislukt.'
export const GAMMA_TIMEOUT_ERROR =
  'Time-out: de generatie duurde langer dan 5 minuten. Probeer het later opnieuw.'
export const GAMMA_DOWNLOAD_ERROR =
  'Het document is opgesteld, maar kon niet automatisch in de Documentenkluis worden opgeslagen. Probeer het opnieuw of neem contact op met Osago.'
