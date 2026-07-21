import { type SalesDocumentKind } from '../types'

export const SALES_DOCUMENT_FILE_TYPE = 'application/msword'

// Fallback for the "bevoegde rechter"/"opgemaakt te" fields in the NDA when the
// seller has no location (osago-bundle.js:22073, 22082).
export const NDA_FALLBACK_COURT_CITY = 'Amsterdam'

// Shared first sentence of the red disclaimer box + the disclaimer-modal alert
// (osago-bundle.js:21874, 21991, …). The final sentence differs per document.
export const SALES_DOCUMENT_DISCLAIMER_INTRO =
  'Dit is een standaardtemplate ter ondersteuning van het verkoopproces en vormt geen vervanging voor juridisch advies. Wij adviseren je dit document vóór ondertekening te laten beoordelen door een M&A jurist, met name indien sprake is van bijzondere omstandigheden zoals concurrentiegevoelige informatie, internationale partijen of grote transactiewaarden.'

export interface SalesDocumentMeta {
  buttonLabel: string
  disclaimerClosing: string
  docCardTitle: string
  extraIntro: string[]
  generateLabel: string
  modalTitle: string
  savedIntro: string
}

// Per-kind copy for the doc-card button, disclaimer modal, and vault-saved
// confirmation (osago-bundle.js:21726/21767/21781 doc-cards; 21872/22184/22475
// disclaimer modals).
export const SALES_DOCUMENTS: Record<SalesDocumentKind, SalesDocumentMeta> = {
  contract: {
    buttonLabel: 'Genereer verkoopcontract',
    disclaimerClosing:
      'Osago aanvaardt geen aansprakelijkheid voor de volledigheid en juistheid van dit verkoopcontract.',
    docCardTitle: 'Verkoopcontract',
    extraIntro: [
      'Het verkoopcontract bevat een algemeen kaderwerk met de partijen ingevuld. Commerciële voorwaarden (koopprijs, structuur, garanties, closing) blijven als placeholder staan en moeten samen met een M&A-jurist worden ingevuld.',
    ],
    generateLabel: 'Verkoopcontract genereren',
    modalTitle: 'Verkoopcontract genereren',
    savedIntro:
      'Het document wordt opgeslagen in jouw Documentenkluis waar je het kunt downloaden, opnieuw bekijken of delen.',
  },
  loi: {
    buttonLabel: 'Genereer LOI',
    disclaimerClosing:
      'Osago aanvaardt geen aansprakelijkheid voor de volledigheid en juistheid van deze intentieverklaring.',
    docCardTitle: 'Intentieverklaring (LOI)',
    extraIntro: [
      'De intentieverklaring legt de hoofdlijnen vast voor het verdere onderhandelingstraject: indicatieve koopprijs, exclusiviteit, geheimhouding, due-diligence-periode en kostenverdeling. Commerciële details worden als placeholder ingevuld en moeten samen met een M&A-jurist worden vastgesteld.',
    ],
    generateLabel: 'LOI genereren',
    modalTitle: 'Intentieverklaring (LOI) genereren',
    savedIntro:
      'Het document wordt opgeslagen in jouw Documentenkluis waar je het kunt downloaden, opnieuw bekijken of delen.',
  },
  nda: {
    buttonLabel: 'Genereer NDA',
    disclaimerClosing:
      'Osago aanvaard geen aansprakelijkheid voor de volledigheid en juistheid van deze NDA.',
    docCardTitle: 'Geheimhoudingsovereenkomst (NDA)',
    extraIntro: [],
    generateLabel: 'NDA genereren',
    modalTitle: 'NDA genereren',
    savedIntro:
      'De NDA wordt opgeslagen in jouw Documentenkluis waar je hem kunt downloaden, opnieuw bekijken of delen.',
  },
}
