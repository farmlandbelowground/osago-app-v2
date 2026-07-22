import { type LeadStage } from '../types'

export interface UpsellOption {
  desc: string
  id: string
  price: string
  stages: LeadStage[]
  title: string
  unit: string
}

// Ports UPSELL_OPTIONS (osago-bundle.js:12224-12231). Legacy UI stage keys are
// mapped to v2's DB-enum stage keys: contact→contact_made, qualified→
// interest_confirmed, nda→negotiation, loi→closing.
export const UPSELL_OPTIONS: readonly UpsellOption[] = [
  {
    desc: 'Sparring en begeleiding tijdens gesprekken met potentiële kopers.',
    id: 'negotiation',
    price: '€ 150,-',
    stages: ['contact_made', 'interest_confirmed', 'negotiation'],
    title: 'Hulp bij onderhandelingsgesprekken',
    unit: 'per uur',
  },
  {
    desc: 'Een geheimhoudingsovereenkomst toegespitst op jouw situatie en koper.',
    id: 'nda-custom',
    price: '€ 399,-',
    stages: ['contact_made', 'interest_confirmed', 'negotiation'],
    title: 'NDA op maat',
    unit: 'eenmalig',
  },
  {
    desc: 'Een professionele intentieverklaring (Letter of Intent) op maat.',
    id: 'loi',
    price: '€ 750,-',
    stages: ['closing'],
    title: 'Opstellen LOI',
    unit: 'eenmalig',
  },
  {
    desc: "Onze juristen controleren een conceptovereenkomst op risico's en valkuilen.",
    id: 'spa-review',
    price: '€ 750,-',
    stages: ['closing'],
    title: 'Juridische controle verkoopovereenkomst',
    unit: 'eenmalig',
  },
  {
    desc: 'Volledige verkoopovereenkomst (SPA) opgesteld door een Osago-jurist.',
    id: 'spa-draft',
    price: '€ 1.750,-',
    stages: ['closing'],
    title: 'Opstellen verkoopovereenkomst',
    unit: 'eenmalig',
  },
  {
    desc: 'Voorbereiding en begeleiding tijdens het due-diligence-traject.',
    id: 'due-diligence',
    price: '€ 150,-',
    stages: ['closing'],
    title: 'Hulp bij due diligence',
    unit: 'per uur',
  },
]

export const UPSELL_NONE_LINE =
  '    Op dit moment zijn er geen specifieke upgrades aan deze fase gekoppeld.'
