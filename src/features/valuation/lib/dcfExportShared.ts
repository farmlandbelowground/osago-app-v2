import {
  type DcfNewComputeResult,
  type DcfNewResolvedInputs,
  type FinancialYearInput,
} from '../types'

export interface DcfExportCompany {
  bedrijfMarktOntwikkeling: number | null
  dcfApplyEnabled: boolean
  kvkNummer: string | null
  lastClosedYear: number | null
  name: string
  sector: string
}

export interface DcfExportData {
  company: DcfExportCompany
  financials: Record<number, FinancialYearInput>
  inputs: DcfNewResolvedInputs
  result: DcfNewComputeResult
}

export const dcfExportFileBase = (companyName: string): string => {
  const slug =
    companyName
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'bedrijf'

  return `dcf-export-${slug}-${new Date().toISOString().split('T')[0]}`
}

export const dcfAllYears = (result: DcfNewComputeResult): number[] => [
  ...result.berekening.historicalYears,
  ...result.berekening.scenarioYears,
  result.berekening.restYear,
]

export const dcfYearType = (
  result: DcfNewComputeResult,
  year: number,
): string => {
  if (year === result.berekening.restYear) {
    return 'Rest'
  }
  if (result.berekening.scenarioYears.includes(year)) {
    return 'Scenario'
  }
  return 'Historisch'
}
