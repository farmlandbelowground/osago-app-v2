import {
  getShareholderValueAdjustment,
  getValuationRecord,
} from '@features/valuation'
import { getServerClient } from '@shared/supabase/server'

import { type PresentationGammaValuation } from './lib/buildPresentationGammaPrompt'
import { PresentationExtraSchema } from './schema'
import {
  type PresentationData,
  type PresentationExtra,
  type PresentationFields,
  type PresentationImages,
  type PresentationReviewStatus,
} from './types'

const readPresentationExtra = async (
  userId: string,
): Promise<PresentationExtra> => {
  const supabase = await getServerClient()
  const { data } = await supabase
    .from('companies')
    .select('extra')
    .eq('user_id', userId)
    .maybeSingle()

  const parsed = PresentationExtraSchema.safeParse(data?.extra)
  return parsed.success ? parsed.data : {}
}

// Reads the presentation slice of companies.extra (spec §3.6).
export const getPresentationData = async (
  userId: string,
): Promise<PresentationData> => {
  const extra = await readPresentationExtra(userId)

  const reviewStatus: PresentationReviewStatus =
    extra.presentationReview?.status ?? 'none'

  return {
    fields: (extra.presentationFields ?? {}) as PresentationFields,
    photos: (extra.presentationImages ?? {}) as PresentationImages,
    hiddenTabs: extra.presentationTabsHidden ?? [],
    includeValuation: extra.presentationIncludeValuation ?? false,
    reviewStatus,
  }
}

// Maps the v2 valuation record to legacy's db.valuations.{low,mid,high,equityValue}
// figures the memorandum prompt reads (spec §3.3 data-source substitution).
// equityValue = central enterprise value + the shareholder-value adjustment.
export const getMemorandumValuationFigures = async (
  userId: string,
): Promise<PresentationGammaValuation | null> => {
  const { result } = await getValuationRecord(userId)
  if (!result) {
    return null
  }

  const adjustment = await getShareholderValueAdjustment(userId)

  return {
    low: result.low,
    mid: result.midpoint,
    high: result.high,
    equityValue: result.midpoint + adjustment,
  }
}
