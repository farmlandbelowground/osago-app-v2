import { MIJN_BEDRIJF_PATH } from '@features/company/constants'
import { type Company } from '@features/company/types'
import {
  KOPERMATCHING_PATH,
  VERKOOPPROCES_PATH,
} from '@features/leads/constants/routes'
import { VERKOOPPRESENTATIE_PATH } from '@features/presentation/constants/routes'
import { ABONNEMENT_AFSLUITEN_PATH } from '@features/subscriptions/constants'
import { subStatus } from '@features/subscriptions/lib/subStatus'
import { type Subscription } from '@features/subscriptions/types'
import {
  FINANCIELE_GEGEVENS_PATH,
  VALUE_DRIVERS_PATH,
  WAARDEBEPALING_PATH,
  WAARDERINGSRAPPORT_PATH,
} from '@features/valuation/constants/routes'

import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  REQUIRED_COMPANY_FIELDS,
} from '../constants'
import { type DashboardTodo } from '../types'

interface ComputeDashboardTodosInput {
  anonDone: boolean
  autoLeadStarted: boolean
  company: Company | null
  financialsAnyValue: boolean
  hasValuationPdfInVault: boolean
  hasWerkruimteAccess: boolean
  manualLeadsCount: number
  memoDone: boolean
  newStageLeadNames: string[]
  presentationFieldsFilled: boolean
  subscription: Subscription | null
  valuationCanBeMade: boolean
  valuationMade: boolean
  valuationReportStarted: boolean
  valueDriversComplete: boolean
  werkruimteUnlocked: boolean
}

export const isCompanyProfileComplete = (company: Company | null): boolean =>
  REQUIRED_COMPANY_FIELDS.every(field => {
    const value = company?.[field]
    return value !== undefined && value !== null && String(value).trim() !== ''
  })

export const computeDashboardTodos = ({
  anonDone,
  autoLeadStarted,
  company,
  financialsAnyValue,
  hasValuationPdfInVault,
  hasWerkruimteAccess,
  manualLeadsCount,
  memoDone,
  newStageLeadNames,
  presentationFieldsFilled,
  subscription,
  valuationCanBeMade,
  valuationMade,
  valuationReportStarted,
  valueDriversComplete,
  werkruimteUnlocked,
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

    todos.push({
      done: valuationReportStarted,
      href: WAARDERINGSRAPPORT_PATH,
      label: 'Vul de gegevens ten behoeve van het waarderingsrapport in',
    })

    if (valuationCanBeMade || valuationMade) {
      todos.push({
        done: valuationMade,
        href: WAARDEBEPALING_PATH,
        label: 'Maak de waardering',
      })
    }

    // "Waarderingsrapport maken" — only after the valuation is made; done once
    // the PDF is in the vault (osago-bundle.js:3914-3916). Legacy targeted
    // /waardebepaling; v2 targets /waarderingsrapport, where the generate button
    // actually lives (spec §3.9/§3.12).
    if (valuationMade) {
      todos.push({
        done: hasValuationPdfInVault,
        href: WAARDERINGSRAPPORT_PATH,
        label: 'Waarderingsrapport maken',
      })
    }
  }

  // Werkruimte block (osago-bundle.js:3918-3944). The presentation to-dos always
  // show for full-plan subscribers; the buyer to-dos only once both documents
  // unlock the werkruimte.
  if (hasWerkruimteAccess) {
    todos.push({
      done: presentationFieldsFilled,
      href: VERKOOPPRESENTATIE_PATH,
      label:
        'Vul de gegevens voor het anonieme verkoopprofiel en het verkoopmemorandum in',
    })
    todos.push({
      done: memoDone,
      href: VERKOOPPRESENTATIE_PATH,
      label: 'Maak het verkoopmemorandum',
    })
    todos.push({
      done: anonDone,
      href: VERKOOPPRESENTATIE_PATH,
      label: 'Maak het anoniem verkoopprofiel',
    })

    if (werkruimteUnlocked) {
      todos.push({
        done: autoLeadStarted,
        href: KOPERMATCHING_PATH,
        label: 'Start de automatische leadsidentificatie',
      })
      todos.push({
        done: manualLeadsCount > 0,
        href: KOPERMATCHING_PATH,
        label: 'Voeg handmatig leads toe',
      })
      for (const name of newStageLeadNames) {
        todos.push({
          done: false,
          href: VERKOOPPROCES_PATH,
          label: `Interesse van ${name} opvolgen`,
        })
      }
    }
  }

  return todos
}
