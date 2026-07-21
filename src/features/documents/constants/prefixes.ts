// The file-name prefixes the self-generated document vault uses as a shared
// vocabulary. `documentExistsByPrefix` (queries.ts) is the join point Slice 9
// keys its `hasValuationPdfInVault` / `isMemorandumGenerated` /
// `isAnonymousProfileGenerated` flags off — declared here now so the vocabulary
// lives in one place. Sales-document prefixes match the filenames built in
// features/leads/lib/salesDocuments.
export const DOCUMENT_PREFIXES = {
  anonymousProfile: 'Anoniem verkoopprofiel',
  contract: 'Verkoopcontract_',
  // Trailing space is load-bearing: legacy backs the scorecard "reeds gemaakt"
  // check on fileName.startsWith('Verbeterrapport ') (osago-bundle.js:7615).
  improvementReport: 'Verbeterrapport ',
  jaarstukkenUpload: 'Jaarstukken upload',
  loi: 'LOI_',
  memorandum: 'Verkoopmemorandum',
  nda: 'NDA_',
  valuationReport: 'Waarderingsrapport',
} as const
