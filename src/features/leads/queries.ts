import { getServerClient } from '@shared/supabase/server'

import { ACTIVE_CONVERSATION_STAGES } from './constants/stages'
import { LeadRowSchema, LeadStageRowSchema, type LeadRow } from './schema'
import { type BuyerPipelineCounts, type Lead, type LeadType } from './types'

const rowToLead = (row: LeadRow): Lead => ({
  addedAt: row.added_at,
  addedManually: row.added_manually,
  autoSourceWebsite: row.auto_source_website,
  city: row.city,
  contactEmail: row.contact_email,
  contactFirstName: row.contact_first_name,
  contactLastName: row.contact_last_name,
  contactLegacy: row.contact_legacy,
  contactPhone: row.contact_phone,
  country: row.country,
  fitScore: row.fit_score,
  houseNumber: row.house_number,
  houseNumberAddition: row.house_number_addition,
  id: row.id,
  leadType: row.lead_type,
  location: row.location,
  name: row.name,
  notes: row.notes,
  postalCode: row.postal_code,
  promotedAt: row.promoted_at,
  promotedFromManualAt: row.promoted_from_manual_at,
  promotedFromOsagoLeadAt: row.promoted_from_osago_lead_at,
  promotedToPipeline: row.promoted_to_pipeline,
  sector: row.sector,
  source: row.source,
  stage: row.stage,
  street: row.street,
  type: row.type,
  userId: row.user_id,
  validatedAt: row.validated_at,
  validatedBy: row.validated_by,
  validatedByOsago: row.validated_by_osago,
  validationFee: row.validation_fee,
  validationPaidAt: row.validation_paid_at,
  validationStatus: row.validation_status,
  website: row.website,
})

const parseLeads = (rows: unknown[]): Lead[] =>
  rows
    .map(row => LeadRowSchema.safeParse(row))
    .filter(result => result.success)
    .map(result => rowToLead(result.data))

const sortCandidates = (leads: Lead[], leadType: LeadType): Lead[] => {
  const sorted = [...leads]
  if (leadType === 'auto_identified') {
    // fit_score desc (osago-bundle.js:21059).
    return sorted.sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
  }
  if (leadType === 'osago_validated') {
    // validated_at/added_at desc (osago-bundle.js:20892).
    const key = (lead: Lead): string => lead.validatedAt ?? lead.addedAt
    return sorted.sort((a, b) => key(b).localeCompare(key(a)))
  }
  // manual: added_at desc (osago-bundle.js:20593).
  return sorted.sort((a, b) => b.addedAt.localeCompare(a.addedAt))
}

export const getCandidateLeads = async (
  userId: string,
  leadType: LeadType,
): Promise<Lead[]> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', userId)
    .eq('lead_type', leadType)

  if (error || !data) {
    return []
  }

  return sortCandidates(parseLeads(data), leadType)
}

export const getPipelineLeads = async (userId: string): Promise<Lead[]> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', userId)
    .eq('lead_type', 'pipeline')
    .order('added_at', { ascending: true })

  if (error || !data) {
    return []
  }

  return parseLeads(data)
}

export const getLeadById = async (
  userId: string,
  id: string,
): Promise<Lead | null> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const result = LeadRowSchema.safeParse(data)
  return result.success ? rowToLead(result.data) : null
}

// Moved verbatim from features/dashboard (spec §3.8) — the dashboard buyer KPIs.
export const getBuyerPipelineCounts = async (
  userId: string,
): Promise<BuyerPipelineCounts> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('leads')
    .select('stage')
    .eq('user_id', userId)
    .eq('lead_type', 'pipeline')

  if (error || !data) {
    return { activeConversations: 0, identifiedBuyers: 0 }
  }

  const stages = data
    .map(row => LeadStageRowSchema.safeParse(row))
    .filter(result => result.success)
    .map(result => result.data.stage)

  return {
    activeConversations: stages.filter(stage =>
      ACTIVE_CONVERSATION_STAGES.includes(stage),
    ).length,
    identifiedBuyers: stages.filter(stage => stage !== 'no_interest').length,
  }
}
