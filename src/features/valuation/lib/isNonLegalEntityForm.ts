// True for legal forms without shares (so no shareholder value / ASH gauge).
// Ports isNonLegalEntityForm (osago-bundle.js:12759).
export const isNonLegalEntityForm = (legalForm: string): boolean =>
  legalForm === 'Eenmanszaak' ||
  legalForm === 'Vennootschap onder firma (V.O.F.)'
