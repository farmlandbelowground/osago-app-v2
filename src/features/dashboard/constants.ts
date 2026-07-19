import { type Company } from '@features/company/types'
import { type SubscriptionStatus } from '@features/subscriptions/types'

import { type LeadPipelineStage } from './schema'

export const REQUIRED_COMPANY_FIELDS: readonly (keyof Company)[] = [
  'name',
  'website',
  'sector',
  'legalForm',
  'street',
  'houseNumber',
  'postalCode',
  'city',
  'founded',
  'employees',
  'description',
  'usp',
]

export const ACTIVE_SUBSCRIPTION_STATUSES: readonly SubscriptionStatus[] = [
  'active',
  'ending',
  'renewed',
]

export const ACTIVE_CONVERSATION_STAGES: readonly LeadPipelineStage[] = [
  'contact_made',
  'interest_confirmed',
  'negotiation',
  'closing',
]

export const WELCOME_VIDEO_URL =
  'https://www.loom.com/embed/0f63403614934cc7ade9deadf987f23d'
export const WELCOME_VIDEO_DONE_THRESHOLD = 4

export const TODO_PROGRESS_PERCENTAGE_MULTIPLIER = 100
