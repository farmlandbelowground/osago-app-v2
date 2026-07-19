import { MIJN_BEDRIJF_PATH } from '@features/company/constants'
import { type Company } from '@features/company/types'
import { ABONNEMENT_AFSLUITEN_PATH } from '@features/subscriptions/constants'
import { subStatus } from '@features/subscriptions/lib/subStatus'
import { type Subscription } from '@features/subscriptions/types'

import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  REQUIRED_COMPANY_FIELDS,
} from '../constants'
import { type DashboardTodo } from '../types'

interface ComputeDashboardTodosInput {
  company: Company | null
  subscription: Subscription | null
}

export const isCompanyProfileComplete = (company: Company | null): boolean =>
  REQUIRED_COMPANY_FIELDS.every(field => {
    const value = company?.[field]
    return value !== undefined && value !== null && String(value).trim() !== ''
  })

export const computeDashboardTodos = ({
  company,
  subscription,
}: ComputeDashboardTodosInput): DashboardTodo[] => {
  const todos: DashboardTodo[] = []

  if (!ACTIVE_SUBSCRIPTION_STATUSES.includes(subStatus(subscription).status)) {
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

  return todos
}
