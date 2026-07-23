// Fixed Dutch text blocks for the fixed-template valuation report (Gamma PDF
// flow). Ported VERBATIM from legacy #65 (osago-bundle.js): user-facing document
// copy, kept word-for-word.

export const VAL_DRIVER_DEFS: [string, string][] = [
  [
    'Afhankelijkheid afnemers',
    'Hoe geconcentreerd is de omzet bij weinig klanten, hoe terugkerend is de omzet en hoe makkelijk kunnen klanten overstappen of zonder het product.',
  ],
  [
    'Afhankelijkheid leveranciers',
    'Hoe makkelijk wordt overgestapt naar andere leveranciers, hoe verkrijgbaar de inkoop is en hoe sterk de onderhandelpositie is.',
  ],
  [
    'Afhankelijkheid directie/management',
    'In welke mate het bedrijf leunt op de DGA, directie of specifieke medewerkers — en wat het effect op de omzet zou zijn als zij wegvallen.',
  ],
  [
    'Spreiding activiteiten',
    'Hoe gespreid is de omzet over klantgroepen, branches, landen en het belangrijkste product.',
  ],
  [
    'Toetredingsbarrières tot de markt',
    'Hoe moeilijk is het voor nieuwe partijen om de markt te betreden — door benodigd kapitaal, schaalvoordelen of regelgeving.',
  ],
  [
    'Track record van het bedrijf',
    'Hoe stabiel is het verloop van omzet, winst en cashflow, en hoe staat het bedrijf bekend op social media en beoordelingsplatformen.',
  ],
  [
    'Flexibiliteit en schaalbaarheid bedrijf',
    'Hoe makkelijk kan het bedrijf op- of afschalen, nieuwe medewerkers of financiering aantrekken en omschakelen naar andere producten/diensten.',
  ],
]

export const VAL_BEGRIPPEN_BASE: [string, string][] = [
  [
    'Normalisatie-aanpassingen',
    'Correcties op de historische cijfers om eenmalige posten en niet-marktconforme keuzes uit de EBITDA te halen — denk aan rechtszaak-kosten, terugvorderingen, niet-marktconforme directeursbeloning of huur tegen afwijkende voorwaarden. Het doel is de cijfers terug te brengen naar een toestand die een koper realistisch zou aantreffen na overname.',
  ],
  [
    'EBITDA',
    'Earnings Before Interest, Taxes, Depreciation and Amortization — het operationele resultaat vóór rente, belastingen, afschrijvingen en amortisatie. Vaak gebruikt als benadering van de operationele kasstroom.',
  ],
  [
    'Sector multiple',
    'De factor waarmee de EBITDA wordt vermenigvuldigd om tot een indicatie van de ondernemingswaarde te komen. Afgeleid van markttransacties binnen de sector; weerspiegelt hoe de markt rendement, groei en risico inschat.',
  ],
  [
    'Sector-multiple correctie',
    'Een correctie op de sector-multiple voor ondernemingen die kleiner of organisatorisch minder gespreid zijn dan een typische sectorgenoot. Kleinere ondernemingen worden doorgaans tegen een lagere multiple verhandeld.',
  ],
  [
    'Bandbreedte',
    'Een waardering is geen exact getal. De bandbreedte rond de midpoint laat ruimte voor de specifieke marktomstandigheden, de uitkomst van een due diligence en het verloop van de onderhandelingen.',
  ],
]

export const VAL_BEGRIPPEN_DCF: [string, string][] = [
  [
    'Risicovrij rendement',
    'Het rendement op een risicovrije belegging (staatsobligaties), als ondergrens voor de vermogenskostenvoet.',
  ],
  [
    'Marktrisicopremie',
    'De extra vergoeding die beleggers verlangen voor het risico van beleggen in aandelen boven het risicovrije rendement.',
  ],
  [
    'Sectorcorrectie',
    'Correctie op de kostenvoet voor het specifieke risicoprofiel van de sector.',
  ],
  [
    'Illiquiditeitspremie',
    'Opslag omdat een aandeel in een niet-beursgenoteerde MKB-onderneming minder makkelijk verhandelbaar is.',
  ],
  [
    'Kostenvoet unlevered (KEU)',
    'De vermogenskostenvoet zonder effect van financiering. Voor MKB-ondernemingen doorgaans tussen 12% en 20%.',
  ],
  [
    'Levenscyclus van de onderneming',
    'Bepaalt het groeipercentage van de eeuwigdurende restperiode na de scenariojaren. Vier fases — start/ontwikkeling, groei, stabiel en teruggang — koppelen aan een vast percentage.',
  ],
]

// Take 5 variants carry a fixed contact person; Osago has no employee data, so
// that variant shows no personal contact card.
export const TAKE5_CONTACT = {
  bedrijf: 'Take 5',
  email: 'henk@take5.nl',
  naam: 'Henk de Jong',
  tel: '0164 728 138',
} as const

// The Take 5 Gamma theme id (a live theme on the Osago Gamma API key).
export const TAKE5_THEME_ID = 'qj0zyb2maqvr30h'

// Light purple page fill used when a Take 5 page is shifted/scaled during
// injection (spec §13.4). Osago pages stay white (injectImagesIntoPdf default).
export const PAGE_BG_TAKE5: [number, number, number] = [0.98, 0.984, 0.988]
