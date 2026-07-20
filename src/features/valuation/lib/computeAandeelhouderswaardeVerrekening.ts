import {
  MONTHS_PER_YEAR,
  SHAREHOLDER_VALUE_MONTHS_MAX,
  SHAREHOLDER_VALUE_MONTHS_MIN,
} from '../constants/shareholderValue'
import {
  type FinancialYearInput,
  type ShareholderValueBreakdown,
  type ShareholderValueInputs,
} from '../types'

interface ComputeShareholderValueBreakdownInput {
  financials: Record<number, FinancialYearInput>
  lastClosedYear: number
  shareholderValue: ShareholderValueInputs
}

export const computeAandeelhouderswaardeVerrekeningBreakdown = ({
  shareholderValue,
  financials,
  lastClosedYear,
}: ComputeShareholderValueBreakdownInput): ShareholderValueBreakdown => {
  const finRow = financials[lastClosedYear]

  const cogs = shareholderValue.kostprijsOmzetV2 ?? finRow?.cogs ?? 0
  const opex =
    shareholderValue.bedrijfskostenV2 ?? finRow?.operatingExpenses ?? 0
  const months = Math.max(
    SHAREHOLDER_VALUE_MONTHS_MIN,
    Math.min(
      SHAREHOLDER_VALUE_MONTHS_MAX,
      shareholderValue.totaleKostenMaandenV2 ?? SHAREHOLDER_VALUE_MONTHS_MIN,
    ),
  )
  const totaleKosten = Math.round(
    (((cogs ?? 0) + (opex ?? 0)) * months) / MONTHS_PER_YEAR,
  )

  const debiteuren = shareholderValue.debiteurenV2 ?? 0
  const crediteuren = shareholderValue.crediteurenV2 ?? 0
  const wkExtras = shareholderValue.werkkapitaalExtrasV2.reduce(
    (sum, item) => sum + item.amount,
    0,
  )
  const werkkapitaal = Math.round(debiteuren - crediteuren - wkExtras)
  const positieWerkkap = werkkapitaal - totaleKosten

  const liquideMiddelen = shareholderValue.liquideMiddelenV2 ?? 0
  const vakantiegeld = shareholderValue.vakantiegeldV2 ?? 0
  const kortlopendeSchulden = shareholderValue.kortlopendeSchuldenV2 ?? 0
  const dcfreeExtras = shareholderValue.dcfreeExtrasV2.reduce(
    (sum, item) => sum + item.amount,
    0,
  )
  const dcfree = Math.round(
    liquideMiddelen - (vakantiegeld + kortlopendeSchulden + dcfreeExtras),
  )

  return {
    dcfree,
    positieWerkkap,
    total: positieWerkkap + dcfree,
    totaleKosten,
    werkkapitaal,
  }
}

export const computeAandeelhouderswaardeVerrekening = (
  input: ComputeShareholderValueBreakdownInput,
): number => computeAandeelhouderswaardeVerrekeningBreakdown(input).total
