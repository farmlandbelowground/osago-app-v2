import { type getServerClient } from '@shared/supabase/server'

import { CUSTOMER_ID_PAD, CUSTOMER_ID_PREFIX } from '../constants'

const CUSTOMER_ID_PATTERN = /^K(\d+)$/

// Mirrors nextProjectId: highest existing K###### + 1, zero-padded. Ports the
// legacy K-code assignment (customer_id = 'K' + sequential number).
export const nextCustomerId = (existingIds: string[]): string => {
  let highest = 0

  for (const id of existingIds) {
    const match = CUSTOMER_ID_PATTERN.exec(id)
    if (match) {
      highest = Math.max(highest, parseInt(match[1], 10))
    }
  }

  return CUSTOMER_ID_PREFIX + String(highest + 1).padStart(CUSTOMER_ID_PAD, '0')
}

// Backfills profiles.customer_id for every role='customer' profile lacking one,
// in created_at ascending order so the sequence matches the legacy assignment
// order. Best-effort per-row update (accepts legacy semantics: no unique
// constraint) — a failed update leaves that row for the next pass.
export const ensureCustomerIds = async (
  supabase: Awaited<ReturnType<typeof getServerClient>>,
): Promise<void> => {
  const { data } = await supabase
    .from('profiles')
    .select('id, customer_id, created_at')
    .eq('role', 'customer')
    .order('created_at', { ascending: true })

  const rows = data ?? []
  const existingIds: string[] = rows
    .map(row => row.customer_id)
    .filter((id): id is string => Boolean(id))

  for (const row of rows) {
    if (row.customer_id) {
      continue
    }

    const customerId = nextCustomerId(existingIds)
    existingIds.push(customerId)
    await supabase
      .from('profiles')
      .update({ customer_id: customerId })
      .eq('id', row.id)
  }
}
