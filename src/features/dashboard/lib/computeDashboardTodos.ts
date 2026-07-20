import { MIJN_BEDRIJF_PATH } from '@features/company/constants'
import { type Company } from '@features/company/types'
import { ABONNEMENT_AFSLUITEN_PATH } from '@features/subscriptions/constants'
import { subStatus } from '@features/subscriptions/lib/subStatus'
import { type Subscription } from '@features/subscriptions/types'
import {
  FINANCIELE_GEGEVENS_PATH,
  VALUE_DRIVERS_PATH,
} from '@features/valuation/constants/routes'

import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  REQUIRED_COMPANY_FIELDS,
} from '../constants'
import { type DashboardTodo } from '../types'

interface ComputeDashboardTodosInput {
  company: Company | null
  financialsAnyValue: boolean
  subscription: Subscription | null
  valueDriversComplete: boolean
}

export const isCompanyProfileComplete = (company: Company | null): boolean =>
  REQUIRED_COMPANY_FIELDS.every(field => {
    const value = company?.[field]
    return value !== undefined && value !== null && String(value).trim() !== ''
  })

export const computeDashboardTodos = ({
  company,
  financialsAnyValue,
  subscription,
  valueDriversComplete,
}: ComputeDashboardTodosInput): DashboardTodo[] => {
  const todos: DashboardTodo[] = []

  // Ports legacy's getAllowedCustomerPages (osago-bundle.js:12703-12722):
  // a customer without a lopend (active/ending/renewed) subscription has no
  // access to any valuation page at all, regardless of plan category — both
  // the 'full' and 'valuation' plan categories include 'waardebepaling' in
  // their allowed-pages set once the subscription is lopend, so
  // hasWaardeAccess collapses to this one status check.
  const hasWaardeAccess = ACTIVE_SUBSCRIPTION_STATUSES.includes(
    subStatus(subscription).status,
  )

  if (!hasWaardeAccess) {
    todos.push({
      done: false,
      href: ABONNEMENT_AFSLUITEN_PATH,
      label: 'Sluit een abonnement af om te beginnen',
    })
  }

  todos.push({
    done: !!company?.kvkNummer,
    href: MIJN_BEDRIJF_PATH,
    label: 'Koppel Osago met de Kamer van Koophandel',
  })

  todos.push({
    done: isCompanyProfileComplete(company),
    href: MIJN_BEDRIJF_PATH,
    label: 'Maak alle bedrijfsgegevens compleet',
  })

  if (hasWaardeAccess) {
    todos.push({
      done: financialsAnyValue,
      href: FINANCIELE_GEGEVENS_PATH,
      label: 'Vul de financiële parameters van jouw bedrijf in',
    })

    todos.push({
      done: valueDriversComplete,
      href: VALUE_DRIVERS_PATH,
      label: 'Vul de value drivers van jouw bedrijf in',
    })
  }

  return todos
}
