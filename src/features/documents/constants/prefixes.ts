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
  // The fixed-template IM (Gamma PDF flow, #65) is saved as "Informatiememorandum
  // …"; the older PPTX flow used "Verkoopmemorandum …". Both count as the
  // memorandum for "reeds gemaakt" checks + admin resets.
  informationMemorandum: 'Informatiememorandum',
  jaarstukkenUpload: 'Jaarstukken upload',
  loi: 'LOI_',
  memorandum: 'Verkoopmemorandum',
  nda: 'NDA_',
  // Take 5 valuation variants (#65): "Indicatief/Uitgebreid waarderingsrapport …".
  valuationReportTake5Beknopt: 'Indicatief waarderingsrapport',
  valuationReportTake5Uitgebreid: 'Uitgebreid waarderingsrapport',
  valuationReport: 'Waarderingsrapport',
} as const
