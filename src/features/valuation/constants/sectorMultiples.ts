export const DEFAULT_VALUATION_MULTIPLES = [
  { id: 'software', label: 'Softwareontwikkeling', value: 7.5 },
  { id: 'it_services', label: 'IT-dienstverlening', value: 6.7 },
  { id: 'healthcare', label: 'Gezondheidszorg & Farmacie', value: 6.5 },
  { id: 'agri_food', label: 'Agri & Food', value: 5.3 },
  { id: 'wholesale', label: 'Groothandel', value: 5.2 },
  { id: 'industry', label: 'Industrie & Productie', value: 5.1 },
  { id: 'business_serv', label: 'Zakelijke dienstverlening', value: 5.0 },
  { id: 'ecommerce', label: 'E-commerce & Webshops', value: 5.0 },
  { id: 'construction', label: 'Bouw & Installatietechniek', value: 4.8 },
  { id: 'transport', label: 'Automotive, Transport & Logistiek', value: 4.2 },
  { id: 'media', label: 'Media, Reclame & Communicatie', value: 3.9 },
  { id: 'hospitality', label: 'Horeca, Toerisme & Recreatie', value: 3.3 },
  { id: 'retail', label: 'Detailhandel', value: 2.5 },
] as const

export const EBITDA_FORECAST_YEAR_COUNT = 3

export const EBITDA_YEAR_WEIGHTS_DEFAULT = {
  lastClosed: 4,
  forecast1: 3,
  forecast2: 2,
  forecast3: 1,
} as const

export const VALUATION_BAND_DEFAULT_PCT = 0.0371

export const APP_CONFIG_SMALL_EBITDA_DEDUCTIONS_KEY = 'smallEbitdaDeductions'
export const APP_CONFIG_SMALL_ORG_DEDUCTIONS_KEY = 'smallOrgDeductions'
