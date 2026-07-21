// Scorecard relevance filters, ported verbatim from osago-bundle.js:6869-6918.
// Hidden categories/questions keep their stored answers — the filter is
// presentational only (spec §3.6).

// Sector label (as stored on companies.sector, 1:1 with the valuation-multiples
// config label) → category ids hidden for that sector. The core categories
// (algemeen, dga, strat-beleid, mis, sales-marketing, finance, juridisch) are
// never listed and stay visible for every sector (osago-bundle.js:6869-6883).
export const SCORECARD_TAB_HIDDEN_BY_SECTOR: Record<string, readonly string[]> =
  {
    Softwareontwikkeling: [
      'productie',
      'inkoop',
      'serv-onderh',
      'kwal-veiligheid',
    ],
    'IT-dienstverlening': [
      'productie',
      'inkoop',
      'serv-onderh',
      'kwal-veiligheid',
    ],
    'Gezondheidszorg & Farmacie': ['productie', 'serv-onderh'],
    'Agri & Food': ['serv-onderh'],
    Groothandel: ['productie', 'serv-onderh', 'kwal-veiligheid', 'rd'],
    'Industrie & Productie': [],
    'Zakelijke dienstverlening': [
      'productie',
      'inkoop',
      'serv-onderh',
      'kwal-veiligheid',
      'rd',
    ],
    'E-commerce & Webshops': [
      'productie',
      'serv-onderh',
      'kwal-veiligheid',
      'rd',
    ],
    'Bouw & Installatietechniek': ['rd'],
    'Automotive, Transport & Logistiek': ['productie', 'rd'],
    'Media, Reclame & Communicatie': [
      'productie',
      'inkoop',
      'serv-onderh',
      'kwal-veiligheid',
      'rd',
    ],
    'Horeca, Toerisme & Recreatie': ['productie', 'serv-onderh', 'rd'],
    Detailhandel: ['productie', 'serv-onderh', 'kwal-veiligheid', 'rd'],
  }

// Shareholder / holding-structure questions, hidden when the legal form has no
// shares (osago-bundle.js:6888-6897).
export const SCORECARD_SHAREHOLDER_QUESTION_IDS: ReadonlySet<string> = new Set([
  'dga-q4',
  'dga-q5',
  'dga-q7',
  'dga-q8',
  'dga-q9',
  'dga-q13',
  'dga-q14',
  'dga-q21',
])

// Legal forms that DO carry shares (osago-bundle.js:6898-6902). These are the
// exact full labels v2's LEGAL_FORM_OPTIONS already stores, so string-equality
// matches with no reconciliation (spec OQ-4).
export const SCORECARD_BV_NV_LEGAL_FORMS: ReadonlySet<string> = new Set([
  'Besloten vennootschap (B.V.)',
  'Naamloze vennootschap (N.V.)',
  'Europese naamloze vennootschap (S.E.)',
])

// Non-HRM questions relevant only with personnel; hidden (together with the
// whole HRM category) when employees === 0 (osago-bundle.js:6907-6918).
export const SCORECARD_PERSONNEL_QUESTION_IDS: ReadonlySet<string> = new Set([
  'algemeen-q14',
  'algemeen-q15',
  'algemeen-q16',
  'algemeen-q17',
  'strat-beleid-q3',
  'strat-beleid-q24',
  'productie-q16',
  'productie-q17',
  'productie-q20',
  'productie-q21',
  'productie-q22',
  'serv-onderh-q4',
  'kwal-veiligheid-q3',
  'kwal-veiligheid-q22',
  'kwal-veiligheid-q23',
  'kwal-veiligheid-q24',
])
