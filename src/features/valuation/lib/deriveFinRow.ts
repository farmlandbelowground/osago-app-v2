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

  const ebitda =
    profitBeforeTax === null &&
    input.depreciation === null &&
    input.interest === null &&
    input.taxesPaid === null &&
    normalizationsAddon === 0
      ? null
      : (profitBeforeTax ?? 0) +
        (input.depreciation ?? 0) +
        (input.interest ?? 0) +
        (input.taxesPaid ?? 0) +
        normalizationsAddon

  return {
    ...input,
    grossProfit,
    profitBeforeTax,
    normalizationsApplied: normalizationsAddon,
    ebitda,
  }
}
