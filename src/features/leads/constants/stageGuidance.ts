import { type LeadStage } from '../types'

// Content for the green step-info panel inside PipelineDetailModal, per stage.
// Source: osago-content-processtappen.docx.
//
// Interpretation notes:
//   - `nextStage` moves the buyer forward. `no_interest` has no forward but a
//     backStage to revive an abandoned buyer, and `closing` is a terminal
//     state so it has neither.
//   - `docs` is a checklist of documents the seller must share in this stage.
//     `docsNone` is a fallback string when the stage has no docs (used by
//     `new` and `no_interest`).
//   - `tip` on a checklist item is optional and renders as a hover-info icon
//     using the existing `.info-tip` class.

export interface ChecklistItem {
  id: string
  text: string
  tip?: string
}

export interface StageGuidance {
  actions: ChecklistItem[]
  backStage?: LeadStage
  docs: ChecklistItem[]
  docsNone?: string
  nextStage?: LeadStage
  transition: string
}

export const STAGE_GUIDANCE: Record<LeadStage, StageGuidance> = {
  closing: {
    actions: [
      {
        id: 'answer-questions',
        text: 'Beantwoord vragen van de koper en zijn adviseurs',
      },
      {
        id: 'draft-sales-agreement',
        text: 'Laat de koopovereenkomst opstellen en juridisch controleren',
      },
      {
        id: 'plan-notary',
        text: 'Plan de ondertekening en overdracht bij de notaris',
      },
    ],
    docs: [{ id: 'sales-agreement', text: 'Koopovereenkomst' }],
    transition: 'Na ondertekening en overdracht is het traject afgerond.',
  },
  contact_made: {
    actions: [
      {
        id: 'first-conversation',
        text: 'Voer een eerste kennismakingsgesprek en peil de interesse',
      },
      {
        id: 'share-anon-profile',
        text: 'Deel het anonieme verkoopprofiel',
        tip: 'Nog zonder herleidbare of vertrouwelijke gegevens.',
      },
      {
        id: 'sign-nda',
        text: 'Laat de geheimhoudingsovereenkomst tekenen voordat je meer deelt',
      },
      {
        id: 'note-outcome',
        text: 'Leg de uitkomst van het gesprek vast in de notities',
      },
    ],
    docs: [
      { id: 'anon-profile', text: 'Anoniem verkoopprofiel' },
      { id: 'nda', text: 'Geheimhoudingsovereenkomst' },
    ],
    nextStage: 'interest_confirmed',
    transition:
      'Zodra de koper serieuze interesse bevestigt én de geheimhoudingsovereenkomst getekend is.',
  },
  interest_confirmed: {
    actions: [
      {
        id: 'share-memo',
        text: 'Deel het verkoopmemorandum nadat de NDA getekend is',
      },
      {
        id: 'answer-questions',
        text: 'Beantwoord inhoudelijke vragen en plan een verdiepend gesprek',
      },
      {
        id: 'test-financing',
        text: 'Toets of de koper de overname kan financieren',
      },
      {
        id: 'discuss-vision',
        text: 'Bespreek op hoofdlijnen wat de koper voor ogen heeft met het bedrijf',
      },
    ],
    docs: [
      { id: 'memo', text: 'Verkoopmemorandum' },
      {
        id: 'valuation-report',
        text: 'Waarderingsrapport',
        tip: 'Optioneel — alleen als je de onderbouwing wilt delen.',
      },
    ],
    nextStage: 'negotiation',
    transition:
      'Zodra de koper een indicatief bod of concreet voorstel doet.',
  },
  negotiation: {
    actions: [
      {
        id: 'negotiate-terms',
        text: 'Onderhandel over prijs, overnamestructuur en voorwaarden',
      },
      {
        id: 'agreements',
        text: 'Maak afspraken over betaling, garanties en de overdrachtstermijn',
      },
      {
        id: 'transition-role',
        text: 'Bespreek of je na de overdracht betrokken blijft en hoe lang',
      },
      {
        id: 'draft-loi',
        text: 'Leg de afspraken vast in een intentieverklaring',
        tip: 'Ook wel LOI: Letter of Intent.',
      },
    ],
    docs: [
      {
        id: 'loi',
        text: 'Intentieverklaring',
        tip: 'Ook wel LOI: Letter of Intent.',
      },
      {
        id: 'financial-substantiation',
        text: 'Aanvullende financiële onderbouwing op verzoek',
      },
    ],
    nextStage: 'closing',
    transition:
      'Zodra de intentieverklaring door beide partijen is getekend.',
  },
  new: {
    actions: [
      { id: 'assess-fit', text: 'Beoordeel of deze partij past' },
      {
        id: 'decide-approach',
        text: 'Controleer of je deze partij wilt benaderen',
      },
    ],
    docs: [],
    docsNone:
      'Nog geen. Deel in deze fase niets waaruit jouw bedrijf herleidbaar is.',
    nextStage: 'contact_made',
    transition: 'Zodra je de partij hebt benaderd en er contact is.',
  },
  no_interest: {
    actions: [
      {
        id: 'note-reason',
        text: 'Leg vast waarom deze partij is afgehaakt',
        tip: 'Dit helpt bij het beoordelen van volgende kopers.',
      },
    ],
    backStage: 'contact_made',
    docs: [],
    docsNone: 'Geen. Een eerder getekende NDA blijft gewoon van kracht.',
    transition:
      'Herleeft de interesse? Zet de koper terug naar een eerdere fase.',
  },
}
