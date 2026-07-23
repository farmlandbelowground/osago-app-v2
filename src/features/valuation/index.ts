export { FinancialsPageContent } from './components/FinancialsPageContent'
export { ValueDriversForm } from './components/ValueDriversForm'
export { ValuationProgressTracker } from './components/ValuationProgressTracker'
export { ValuationResultCard } from './components/ValuationResultCard'
export { DcfResultCard } from './components/DcfResultCard'
export { ValuationLockInModal } from './components/ValuationLockInModal'
export { ValuationReviewStatusCard } from './components/ValuationReviewStatusCard'
export { MakeValuationButton } from './components/MakeValuationButton'
export { ValuationLockGate } from './components/ValuationLockGate'
export { ValuationReportEditor } from './components/ValuationReportEditor'
export { ValuationReportPrereqGate } from './components/ValuationReportPrereqGate'

export {
  DEFAULT_DCF_NEW_INPUTS,
  getCompanyValuationFields,
  getDcfAdminDefaults,
  getEstimatedValue,
  getFinancials,
  getSmallEbitdaDeductions,
  getSmallOrgDeductions,
  getValuationMultiples,
  getValuationRecord,
  isValuationMade,
  resolveDcfNewInputs,
  resolveDisplayCompanyData,
  type ResolvedCompanyData,
} from './queries'

export {
  getShareholderValueAdjustment,
  recomputeHeuristicValuation,
  submitValuationForReview,
} from './actions'

export { computeValuationProgress } from './lib/computeValuationProgress'
export { computeIndicatieveOndernemingswaarde } from './lib/computeIndicatieveOndernemingswaarde'
export { buildHistoryWeightOverrides } from './lib/buildHistoryWeightOverrides'
export { computeAandeelhouderswaardeVerrekening } from './lib/computeAandeelhouderswaardeVerrekening'
export {
  dcfNewCompute,
  computeSectorcorrectieFromMultiple,
} from './lib/dcfCompute'
export {
  computeHeuristicValuation,
  resolveHeuristicDcfParams,
  deriveHeuristicValuationCompanyInputs,
} from './lib/computeHeuristicValuation'

export {
  FINANCIELE_GEGEVENS_PATH,
  VALUE_DRIVERS_PATH,
  WAARDEBEPALING_PATH,
  WAARDERINGSRAPPORT_PATH,
  MIJN_BEDRIJF_PATH,
} from './constants/routes'
export { DCF_SECTORCORRECTIE_BASE_MULTIPLE } from './constants/dcf'
export { VALUATION_BAND_DEFAULT_PCT } from './constants/sectorMultiples'
export { DEFAULT_SHAREHOLDER_VALUE_INPUTS } from './constants/shareholderValue'

export * from './types'
export { AdminValuationSettings } from './components/admin/AdminValuationSettings'
export { ValuationControleCard } from './components/medewerker/ValuationControleCard'
export { ValuationControleDcfCard } from './components/medewerker/ValuationControleDcfCard'
export { ValuationReportEmployeeTools } from './components/medewerker/ValuationReportEmployeeTools'
export { ValuationUnlockButton } from './components/medewerker/ValuationUnlockButton'
export {
  approveValuationReviewByAdmin,
  resetValuationByAdmin,
  resetValuationPdfByAdmin,
} from './actions'
export {
  buildValuationPptxT5,
  type T5DeckData,
} from './lib/buildValuationPptxT5'
export {
  type DcfExportCompany,
  type DcfExportData,
} from './lib/dcfExportShared'
