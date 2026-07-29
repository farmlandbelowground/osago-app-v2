import { type FinancialYearDerived, type FinancialYearInput } from '../types'

interface DeriveFinRowExtras {
  normalizationsAddon: number
  operatingExpensesAddon: number
}

export const deriveFinRow = (
  input: FinancialYearInput,
  extras: DeriveFinRowExtras,
): FinancialYearDerived => {
  const { operatingExpensesAddon, normalizationsAddon } = extras

  const grossProfit =
    input.revenue === null && input.cogs === null
      ? null
      : (input.revenue ?? 0) - (input.cogs ?? 0)

  const profitBeforeTax =
    input.revenue === null &&
    input.cogs === null &&
    input.operatingExpenses === null &&
    operatingExpensesAddon === 0
      ? null
      : (input.revenue ?? 0) -
        (input.cogs ?? 0) -
        (input.operatingExpenses ?? 0) -
        operatingExpensesAddon

  // EBITDA = Nettowinst voor belastingen + Afschrijvingen + Normaliseringen.
  // Rentelasten en Betaalde belastingen worden hier NIET meer opgeteld: de
  // "Nettowinst voor belastingen" in deze tabel zit al vóór rente/tax
  // (PBT = omzet − kostprijs − bedrijfskosten), dus dubbeltellen zou fout zijn.
  const ebitda =
    profitBeforeTax === null &&
    input.depreciation === null &&
    normalizationsAddon === 0
      ? null
      : (profitBeforeTax ?? 0) +
        (input.depreciation ?? 0) +
        normalizationsAddon

  return {
    ...input,
    grossProfit,
    profitBeforeTax,
    normalizationsApplied: normalizationsAddon,
    ebitda,
  }
}
