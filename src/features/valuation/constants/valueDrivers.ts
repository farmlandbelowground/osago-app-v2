export interface ValueDriverDefinition {
  id: `q${number}`
  question: string
  type: 'percentage_slider' | 'slider'
  labels?: readonly string[]
  tooltip?: string
}

export const VALUE_DRIVERS: readonly ValueDriverDefinition[] = [
  {
    id: 'q1',
    type: 'percentage_slider',
    question: 'Wat is het aandeel van je drie grootste klanten in de omzet?',
  },
  {
    id: 'q2',
    type: 'percentage_slider',
    question: 'Welk deel van je omzet is terugkerend?',
    tooltip: 'Bijvoorbeeld abonnementen of meerjarige contracten.',
  },
  {
    id: 'q3',
    type: 'slider',
    question: 'Hoe makkelijk stappen je klanten over naar een concurrent?',
    labels: [
      'erg gemakkelijk',
      'gemakkelijk',
      'gemiddeld',
      'moeilijk',
      'heel moeilijk',
    ],
  },
  {
    id: 'q4',
    type: 'slider',
    question: 'Hoe makkelijk kunnen je klanten zonder jouw product of dienst?',
    tooltip:
      'Oftewel: is het voor klanten een optie het product/de dienst helemaal niet in te kopen?',
    labels: [
      'erg gemakkelijk',
      'gemakkelijk',
      'gemiddeld',
      'moeilijk',
      'heel moeilijk',
    ],
  },
  {
    id: 'q5',
    type: 'slider',
    question: 'Hoe makkelijk stap je over naar een andere leverancier?',
    labels: [
      'erg gemakkelijk',
      'gemakkelijk',
      'gemiddeld',
      'moeilijk',
      'heel moeilijk',
    ],
  },
  {
    id: 'q6',
    type: 'slider',
    question: 'Hoe verkrijgbaar zijn de producten en diensten die je inkoopt?',
    labels: [
      'zeer algemeen verkrijgbaar',
      'gemakkelijk verkrijgbaar',
      'gemiddeld',
      'vrij schaars',
      'schaars',
    ],
  },
  {
    id: 'q7',
    type: 'slider',
    question: 'Hoe makkelijk kun je zelf maken wat je nu inkoopt?',
    labels: [
      'erg gemakkelijk',
      'gemakkelijk',
      'gemiddeld',
      'moeilijk',
      'heel moeilijk',
    ],
  },
  {
    id: 'q8',
    type: 'slider',
    question: 'Hoe sterk is je onderhandelpositie tegenover leveranciers?',
    tooltip: 'Ten aanzien van prijs en voorwaarden.',
    labels: ['zeer goed', 'goed', 'neutraal', 'beperkt', 'zeer weinig/geen'],
  },
  {
    id: 'q9',
    type: 'slider',
    question: 'Hoe afhankelijk is je bedrijf van de DGA of directie?',
    tooltip:
      'Afhankelijk vanwege specifieke contacten/relaties of capaciteiten (kennis, ervaring, soft-skills).',
    labels: [
      'zeer afhankelijk',
      'afhankelijk',
      'gemiddeld',
      'beperkt afhankelijk',
      'onafhankelijk',
    ],
  },
  {
    id: 'q10',
    type: 'slider',
    question: 'Hoe afhankelijk is je bedrijf van specifieke medewerkers?',
    tooltip:
      'Afhankelijk vanwege specifieke contacten/relaties of capaciteiten (kennis, ervaring, soft-skills).',
    labels: [
      'zeer afhankelijk',
      'afhankelijk',
      'gemiddeld',
      'beperkt afhankelijk',
      'onafhankelijk',
    ],
  },
  {
    id: 'q11',
    type: 'percentage_slider',
    question:
      'Met hoeveel procent zou je omzet dalen als de DGA of directie direct wordt vervangen?',
  },
  {
    id: 'q12',
    type: 'slider',
    question: 'Verkoop je aan zowel bedrijven als consumenten?',
    labels: ['ja', 'nee'],
  },
  {
    id: 'q13',
    type: 'slider',
    question: 'Verkoop je aan klanten in meerdere branches?',
    tooltip: 'Bijvoorbeeld aan de Bouwsector en aan de Transportsector.',
    labels: ['ja', 'nee'],
  },
  {
    id: 'q14',
    type: 'slider',
    question: 'Verkoop je in meerdere landen?',
    labels: ['ja', 'nee'],
  },
  {
    id: 'q15',
    type: 'percentage_slider',
    question: 'Welk deel van je omzet komt uit je belangrijkste product?',
  },
  {
    id: 'q16',
    type: 'percentage_slider',
    question: 'Welk deel van je omzet wordt via internet gegenereerd?',
    tooltip: 'E-commerce.',
  },
  {
    id: 'q17',
    type: 'slider',
    question:
      'Hoe groot is de dreiging van nieuwe toetreders met voldoende kapitaal?',
    labels: ['zeer groot', 'groot', 'gemiddeld', 'beperkt', 'nauwelijks/niet'],
  },
  {
    id: 'q18',
    type: 'slider',
    question: 'Hoe belangrijk zijn schaalvoordelen in jouw markt?',
    labels: [
      'erg belangrijk',
      'belangrijk',
      'gemiddeld',
      'minder belangrijk',
      'niet significant',
    ],
  },
  {
    id: 'q19',
    type: 'slider',
    question: 'Maakt wet- en regelgeving toetreden tot jouw markt moeilijk?',
    labels: [
      'heel moeilijk',
      'moeilijk',
      'gemiddeld',
      'beperkt',
      'nauwelijks/niet',
    ],
  },
  {
    id: 'q20',
    type: 'slider',
    question:
      'Heeft je bedrijf de afgelopen 3 jaar een stabiel verloop in omzet, winst en cashflow?',
    labels: ['ja', 'nee', 'gedeeltelijk'],
  },
  {
    id: 'q21',
    type: 'slider',
    question: 'Hoe is je omzetgroei vergeleken met het branchegemiddelde?',
    labels: ['hoger', 'gelijk', 'lager'],
  },
  {
    id: 'q22',
    type: 'slider',
    question: 'Heeft je bedrijf veel volgers op social media?',
    tooltip: 'Facebook, LinkedIn, Twitter, Instagram.',
    labels: ['zeer veel', 'veel', 'gemiddeld', 'niet veel', 'weinig/geen'],
  },
  {
    id: 'q23',
    type: 'slider',
    question: 'Heeft je bedrijf veel positieve recensies?',
    tooltip: 'Bijvoorbeeld op Google-review, Trustpilot of de Consumentenbond.',
    labels: ['zeer veel', 'veel', 'gemiddeld', 'niet veel', 'weinig/geen'],
  },
  {
    id: 'q24',
    type: 'slider',
    question: 'Kun je je productie eenvoudig op- of afschalen?',
    labels: ['ja', 'nee', 'beperkt'],
  },
  {
    id: 'q25',
    type: 'slider',
    question: 'Kun je eenvoudig nieuwe medewerkers aantrekken?',
    labels: ['ja', 'nee', 'beperkt'],
  },
  {
    id: 'q26',
    type: 'slider',
    question: 'Kun je eenvoudig nieuwe financiering aantrekken?',
    labels: ['ja', 'nee', 'beperkt'],
  },
  {
    id: 'q27',
    type: 'slider',
    question: 'Kun je eenvoudig omschakelen naar andere producten of diensten?',
    labels: ['ja', 'nee', 'beperkt'],
  },
] as const

export interface ValueDriverSection {
  ids: readonly `q${number}`[]
  title: string
}

export const VD_SECTIONS: readonly ValueDriverSection[] = [
  { title: 'Afhankelijkheid afnemers', ids: ['q1', 'q2', 'q3', 'q4'] },
  { title: 'Afhankelijkheid leveranciers', ids: ['q5', 'q6', 'q7', 'q8'] },
  { title: 'Afhankelijkheid directie/management', ids: ['q9', 'q10', 'q11'] },
  { title: 'Spreiding activiteiten', ids: ['q12', 'q13', 'q14', 'q15', 'q16'] },
  {
    title: 'Toetredingsbarrières tot de markt',
    ids: ['q17', 'q18', 'q19', 'q20', 'q21'],
  },
  { title: 'Track record van het bedrijf', ids: ['q22', 'q23'] },
  {
    title: 'Flexibiliteit en schaalbaarheid bedrijf',
    ids: ['q24', 'q25', 'q26', 'q27'],
  },
] as const

export type VdScoringDirection =
  'lowGood' | 'highGood' | 'positive' | 'inverted'

export interface VdScoringEntry {
  direction: VdScoringDirection
  kind: 'percentage_slider' | 'slider'
}

export const VD_SCORING: Record<`q${number}`, VdScoringEntry> = {
  q1: { kind: 'percentage_slider', direction: 'lowGood' },
  q2: { kind: 'percentage_slider', direction: 'highGood' },
  q3: { kind: 'slider', direction: 'positive' },
  q4: { kind: 'slider', direction: 'positive' },
  q5: { kind: 'slider', direction: 'inverted' },
  q6: { kind: 'slider', direction: 'inverted' },
  q7: { kind: 'slider', direction: 'inverted' },
  q8: { kind: 'slider', direction: 'inverted' },
  q9: { kind: 'slider', direction: 'positive' },
  q10: { kind: 'slider', direction: 'positive' },
  q11: { kind: 'percentage_slider', direction: 'lowGood' },
  q12: { kind: 'slider', direction: 'inverted' },
  q13: { kind: 'slider', direction: 'inverted' },
  q14: { kind: 'slider', direction: 'inverted' },
  q15: { kind: 'percentage_slider', direction: 'lowGood' },
  q16: { kind: 'percentage_slider', direction: 'highGood' },
  q17: { kind: 'slider', direction: 'positive' },
  q18: { kind: 'slider', direction: 'inverted' },
  q19: { kind: 'slider', direction: 'inverted' },
  q20: { kind: 'slider', direction: 'inverted' },
  q21: { kind: 'slider', direction: 'inverted' },
  q22: { kind: 'slider', direction: 'inverted' },
  q23: { kind: 'slider', direction: 'inverted' },
  q24: { kind: 'slider', direction: 'inverted' },
  q25: { kind: 'slider', direction: 'inverted' },
  q26: { kind: 'slider', direction: 'inverted' },
  q27: { kind: 'slider', direction: 'inverted' },
}

export const VALUE_DRIVER_QUESTION_COUNT = 27

export const VD_PERCENTAGE_SLIDER_MIN = 0
export const VD_PERCENTAGE_SLIDER_MAX = 100
export const VD_PERCENTAGE_SLIDER_STEP = 10
export const VD_PERCENTAGE_SLIDER_DEFAULT = 50
