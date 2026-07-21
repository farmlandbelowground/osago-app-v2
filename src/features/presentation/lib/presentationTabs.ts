import {
  AI_COMPOSE_FALLBACK_PATTERN,
  type AiPatternKey,
} from '@shared/ai-compose'

import { type PresentationFieldKey, type PresentationTab } from '../types'

// Ports getPresExtTabs (osago-bundle.js:19003-19094) with the spread
// PRESENTATION_FIELDS (:21332-21353) resolved inline. 17 tabs: `inhoud` is the
// settings panel, the other 16 hold content fields. Labels, keys, rows,
// placeholders, required flags, tooltips, prefills, and `half` are verbatim.
export const PRESENTATION_TABS: readonly PresentationTab[] = [
  {
    id: 'inhoud',
    label: 'Inhoud',
    sectionTitle: 'Inhoud',
    special: 'inhoud',
    required: false,
    fields: [],
  },
  {
    id: 'voorblad',
    label: 'Voorblad',
    sectionTitle: 'Voorblad',
    required: true,
    fields: [
      {
        key: 'ext_tagline',
        label: 'Kernzin',
        rows: 2,
        placeholder: 'Kernachtige tagline voor het voorblad.',
        required: true,
        half: false,
        tooltip:
          'Deze kernzin komt op het voorblad van de teaser en het informatiememorandum. Deze moet kort en bondig prikkelen om het document verder te bekijken.',
      },
    ],
  },
  {
    id: 'kernpropositie',
    label: 'Kernpropositie',
    sectionTitle: 'Kernpropositie',
    required: true,
    fields: [
      {
        key: 'managementSummary',
        label: 'Managementsamenvatting',
        rows: 4,
        placeholder:
          'Korte samenvatting van de onderneming en de propositie voor kopers.',
        required: true,
        half: false,
      },
      {
        key: 'ext_uniek_waarom',
        label: 'Wat mijn bedrijf uniek maakt',
        rows: 3,
        placeholder: 'Wat maakt deze propositie onderscheidend voor een koper?',
        required: true,
        half: false,
      },
    ],
  },
  {
    id: 'historie',
    label: 'Bedrijfsprofiel',
    sectionTitle: 'Bedrijfsprofiel',
    required: true,
    fields: [
      {
        key: 'companyProfile',
        label: 'Bedrijfsprofiel',
        rows: 4,
        placeholder:
          'Wat doet de onderneming, sinds wanneer, belangrijkste mijlpalen.',
        required: true,
        half: false,
        prefill: 'description',
      },
      {
        key: 'ext_historie',
        label: 'Historie',
        rows: 3,
        placeholder:
          'De historie van de onderneming — belangrijkste mijlpalen door de jaren heen.',
        required: true,
        half: false,
      },
      {
        key: 'ext_groeiverhaal',
        label: 'Beschrijving van welke groei de onderneming heeft doorgemaakt',
        rows: 3,
        placeholder: 'Hoe is het bedrijf gegroeid tot waar het nu staat?',
        required: true,
        half: false,
      },
    ],
  },
  {
    id: 'aanbod',
    label: 'Dealinhoud',
    sectionTitle: 'Dealinhoud',
    required: true,
    fields: [
      {
        key: 'ext_wat_aangeboden',
        label: 'Beschrijving van wat er te koop wordt aangeboden',
        rows: 3,
        placeholder: 'Welke onderdelen van de onderneming komen in de deal?',
        required: true,
        half: false,
      },
      {
        key: 'ext_transactievorm',
        label: 'Gewenste transactievorm',
        rows: 2,
        placeholder: 'Aandelentransactie of activa-passiva-transactie.',
        required: false,
        half: false,
      },
      {
        key: 'ext_deal_scope',
        label: 'Beschrijving van wat onderdeel is van de transactie',
        rows: 3,
        placeholder:
          'Welke activa, contracten, klanten, medewerkers vallen binnen de scope?',
        required: true,
        half: false,
      },
      {
        key: 'ext_randvoorwaarden',
        label: 'Randvoorwaarden rondom de transactie',
        rows: 3,
        placeholder:
          'Voorbeeld: earn-out, betrokkenheid post-transactie, prijsvloer.',
        required: false,
        half: false,
      },
    ],
  },
  {
    id: 'structuur',
    label: 'Organisatie',
    sectionTitle: 'Organisatie',
    required: true,
    fields: [
      {
        key: 'organisation',
        label: 'Organisatiestructuur en medewerkers',
        rows: 3,
        placeholder:
          'Team, structuur, sleutelfuncties, afhankelijkheid van de eigenaar.',
        required: false,
        half: false,
      },
      {
        key: 'ext_juridische_structuur',
        label: 'Beschrijving van de bedrijfsstructuur',
        rows: 3,
        placeholder: 'Beschrijf de hoofdstructuur op hoog niveau.',
        required: true,
        half: false,
        tooltip: 'Beschrijving van de juridische structuur.',
      },
      {
        key: 'ext_werkmaatschappijen',
        label: 'Indeling in werkmaatschappijen of entiteiten',
        rows: 3,
        placeholder: 'Lijst van entiteiten met korte omschrijving.',
        required: false,
        half: false,
      },
      {
        key: 'ext_organogram',
        label: 'Verdeling in afdelingen en verantwoordelijkheden',
        rows: 3,
        placeholder: 'Rollen, afdelingen en managementstructuur.',
        required: false,
        half: false,
        tooltip: 'Organogram.',
      },
      {
        key: 'ext_overdraagbaarheid',
        label: 'Overdraagbaarheid en afhankelijkheid van de eigenaar',
        rows: 3,
        placeholder:
          'Hoe afhankelijk is de onderneming van de huidige eigenaar?',
        required: true,
        half: false,
      },
    ],
  },
  {
    id: 'producten',
    label: 'Producten/Diensten',
    sectionTitle: 'Producten/Diensten',
    required: true,
    fields: [
      {
        key: 'productsServices',
        label: 'Omschrijving van de producten/diensten',
        rows: 4,
        placeholder: 'Aanbod en wat de onderneming onderscheidend maakt.',
        required: true,
        half: false,
        prefill: 'usp',
      },
    ],
  },
  {
    id: 'doelgroep',
    label: 'Doelgroep',
    sectionTitle: 'Doelgroep',
    required: true,
    fields: [
      {
        key: 'ext_kenmerken_doelgroep',
        label: 'Doelgroep van de onderneming',
        rows: 3,
        placeholder: 'Wie zijn de belangrijkste klanten?',
        required: true,
        half: false,
      },
      {
        key: 'ext_geografische_regio',
        label: 'Regio waar de onderneming zich op richt',
        rows: 2,
        placeholder: 'Waar zitten de klanten geografisch?',
        required: true,
        half: false,
      },
      {
        key: 'ext_uitbreidingsmogelijkheden',
        label: 'Uitbreidingsmogelijkheden van de onderneming',
        rows: 3,
        placeholder: 'Waar liggen kansen om de doelgroep uit te breiden?',
        required: true,
        half: false,
      },
    ],
  },
  {
    id: 'markt',
    label: 'Markt en ontwikkelingen',
    sectionTitle: 'Markt en ontwikkelingen',
    required: true,
    fields: [
      {
        key: 'market',
        label: 'Omschrijving van de markt en concurrentiepositie',
        rows: 4,
        placeholder: 'Marktomvang, trends, positie t.o.v. concurrenten.',
        required: true,
        half: false,
      },
    ],
  },
  {
    id: 'groei',
    label: 'Groeipotentie',
    sectionTitle: 'Groeipotentie',
    required: false,
    fields: [
      {
        key: 'growth',
        label: 'Groeimogelijkheid voor de onderneming',
        rows: 3,
        placeholder: 'Concrete kansen voor een koper om verder te groeien.',
        required: true,
        half: false,
      },
    ],
  },
  {
    id: 'kanalen',
    label: 'Verkoopkanalen en leveranciers',
    sectionTitle: 'Verkoopkanalen en leveranciers',
    required: false,
    fields: [
      {
        key: 'ext_verkoopkanalen',
        label: 'Verkoopkanalen die de onderneming gebruikt',
        rows: 3,
        placeholder: 'Direct, indirect, online, offline.',
        required: true,
        half: false,
      },
      {
        key: 'ext_marketing',
        label: 'Omschrijf op welke manier de onderneming aan marketing doet',
        rows: 3,
        placeholder: 'Marketingaanpak en -kanalen.',
        required: true,
        half: false,
      },
      {
        key: 'ext_leveranciers',
        label:
          'Omschrijf de wijze waarop de onderneming goederen/diensten betrekt van leveranciers',
        rows: 3,
        placeholder: 'Belangrijkste leveranciers en sourcing-strategie.',
        required: true,
        half: false,
      },
    ],
  },
  {
    id: 'website',
    label: 'Website',
    sectionTitle: 'Website',
    required: false,
    fields: [
      {
        key: 'ext_online_aanwezigheid',
        label: 'Omschrijving van de online aanwezigheid',
        rows: 3,
        placeholder: 'Traffic, conversie, belangrijkste online kanalen.',
        required: true,
        half: false,
      },
      {
        key: 'ext_social_media',
        label: 'Omschrijving van de aanwezigheid op social media',
        rows: 2,
        placeholder: 'Actieve kanalen en follower-basis.',
        required: true,
        half: false,
      },
    ],
  },
  {
    id: 'locatie',
    label: 'Locatie',
    sectionTitle: 'Locatie',
    required: false,
    fields: [
      {
        key: 'ext_huur_koop',
        label: 'Is de locatie van de onderneming huur of koop',
        rows: 1,
        placeholder: 'Huur of koop; wie is verhuurder/eigenaar?',
        required: true,
        half: false,
      },
      {
        key: 'ext_vastgoed_wens',
        label: 'Gaat de locatie mee over naar de nieuwe eigenaar of niet?',
        rows: 2,
        placeholder:
          'Blijft de eigenaar het vastgoed behouden, of gaat het mee?',
        required: true,
        half: false,
      },
      {
        key: 'ext_oppervlakte',
        label: 'Omschrijf de oppervlakte en indeling van de locatie',
        rows: 1,
        placeholder: 'Bijv. 850 m².',
        required: true,
        half: false,
      },
      {
        key: 'ext_locatiebeschrijving',
        label: 'Omschrijf de locatie van de onderneming',
        rows: 3,
        placeholder: 'Ligging, bereikbaarheid, indeling.',
        required: true,
        half: false,
      },
      {
        key: 'ext_locatie_bijzonderheden',
        label:
          'Indien er nog bijzonderheden zijn ten opzichte van de locatie, plaats deze dan hier',
        rows: 3,
        placeholder: 'Contractvorm, resterende looptijd, vergunningen.',
        required: false,
        half: false,
      },
    ],
  },
  {
    id: 'software',
    label: 'Software en ICT',
    sectionTitle: 'Software en ICT',
    required: false,
    fields: [
      {
        key: 'ext_systemen_software',
        label:
          'Omschrijf welke software en ICT systemen de onderneming gebruikt',
        rows: 3,
        placeholder: 'ERP, CRM, kassasysteem, unieke tools.',
        required: true,
        half: false,
      },
      {
        key: 'ext_integratie_overdracht',
        label:
          'Omschrijf in welke mate de software en ICT-omgeving overdraagbaar is',
        rows: 3,
        placeholder:
          'Hoe verlopen integraties en hoe overdraagbaar is de stack?',
        required: true,
        half: false,
      },
    ],
  },
  {
    id: 'swot',
    label: 'SWOT-analyse',
    sectionTitle: 'SWOT-analyse',
    required: false,
    fields: [
      {
        key: 'swotStrengths',
        label: 'SWOT — Sterktes',
        rows: 2,
        placeholder: 'Belangrijkste sterktes.',
        required: true,
        half: true,
      },
      {
        key: 'swotWeaknesses',
        label: 'SWOT — Zwaktes',
        rows: 2,
        placeholder: 'Belangrijkste zwaktes.',
        required: true,
        half: true,
      },
      {
        key: 'swotOpportunities',
        label: 'SWOT — Kansen',
        rows: 2,
        placeholder: 'Belangrijkste kansen.',
        required: true,
        half: true,
      },
      {
        key: 'swotThreats',
        label: 'SWOT — Bedreigingen',
        rows: 2,
        placeholder: 'Belangrijkste bedreigingen.',
        required: true,
        half: true,
      },
      {
        key: 'ext_swot_voor_koper',
        label: 'Omschrijf de impact van de SWOT-analyse voor de koper',
        rows: 3,
        placeholder: 'Samenvattend inzicht voor de koper.',
        required: true,
        half: false,
      },
    ],
  },
  {
    id: 'vervolg',
    label: 'Vervolgproces',
    sectionTitle: 'Vervolgproces',
    required: false,
    fields: [
      {
        key: 'ext_processtappen',
        label: 'Processtappen van het verkooptraject',
        rows: 4,
        placeholder: 'Stapsgewijs proces met tijdlijn.',
        required: true,
        half: false,
      },
    ],
  },
]

// The presentation half of AI_FIELD_OVERRIDES (osago-bundle.js:16057-16096),
// keyed by field key (v2 drops the legacy `pres-ext-field-` DOM-id prefix).
export const PRESENTATION_AI_PATTERNS: Record<
  PresentationFieldKey,
  AiPatternKey
> = {
  ext_tagline: 'highlight',
  managementSummary: 'personal-narrative',
  ext_uniek_waarom: 'descriptive-medium',
  companyProfile: 'descriptive-medium',
  ext_historie: 'descriptive-medium',
  ext_groeiverhaal: 'descriptive-medium',
  ext_wat_aangeboden: 'descriptive-medium',
  ext_transactievorm: 'compact-fact',
  ext_deal_scope: 'descriptive-medium',
  ext_randvoorwaarden: 'descriptive-medium',
  organisation: 'descriptive-medium',
  ext_juridische_structuur: 'descriptive-medium',
  ext_werkmaatschappijen: 'descriptive-medium',
  ext_organogram: 'descriptive-medium',
  ext_overdraagbaarheid: 'descriptive-medium',
  productsServices: 'descriptive-medium',
  ext_kenmerken_doelgroep: 'descriptive-medium',
  ext_geografische_regio: 'compact-fact',
  ext_uitbreidingsmogelijkheden: 'descriptive-medium',
  market: 'descriptive-medium',
  growth: 'descriptive-medium',
  ext_verkoopkanalen: 'descriptive-medium',
  ext_marketing: 'descriptive-medium',
  ext_leveranciers: 'descriptive-medium',
  ext_online_aanwezigheid: 'descriptive-medium',
  ext_social_media: 'compact-fact',
  ext_huur_koop: 'compact-fact',
  ext_vastgoed_wens: 'compact-fact',
  ext_oppervlakte: 'compact-fact',
  ext_locatiebeschrijving: 'descriptive-medium',
  ext_locatie_bijzonderheden: 'descriptive-medium',
  ext_systemen_software: 'descriptive-medium',
  ext_integratie_overdracht: 'descriptive-medium',
  swotStrengths: 'swot-item',
  swotWeaknesses: 'swot-item',
  swotOpportunities: 'swot-item',
  swotThreats: 'swot-item',
  ext_swot_voor_koper: 'swot-synthesis',
  ext_processtappen: 'process-listing',
}

export const CONTENT_TABS: readonly PresentationTab[] =
  PRESENTATION_TABS.filter(tab => tab.special !== 'inhoud')

// Ports the visibleTabs filter (osago-bundle.js:18576-18578): `inhoud` and
// required tabs always show; the rest drop out when hidden.
export const getVisiblePresentationTabs = (
  hiddenTabs: string[],
): PresentationTab[] =>
  PRESENTATION_TABS.filter(
    tab => tab.id === 'inhoud' || tab.required || !hiddenTabs.includes(tab.id),
  )

export const resolvePresentationFieldPattern = (
  key: PresentationFieldKey,
): AiPatternKey => PRESENTATION_AI_PATTERNS[key] ?? AI_COMPOSE_FALLBACK_PATTERN

// The content tab a field belongs to, for same-tab AI context
// (osago-bundle.js gatherSameFieldsetContext :16123-16132).
export const findPresentationFieldTab = (
  key: PresentationFieldKey,
): PresentationTab | undefined =>
  CONTENT_TABS.find(tab => tab.fields.some(field => field.key === key))

export const isPresentationFieldKey = (
  value: string,
): value is PresentationFieldKey =>
  CONTENT_TABS.some(tab => tab.fields.some(field => field.key === value))
