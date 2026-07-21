'use server'

import { legacyApiFetch } from '@shared/api/legacyApiFetch'

import { GAMMA_STATUS_ENDPOINT } from './constants'
import { GammaStatusResponseSchema } from './schema'
import { type GammaStatus } from './types'

// Ports the poll step of generateViaGamma (osago-bundle.js:19744-19759): a
// transient poll error must NOT abort the flow — legacy `continue`s to the next
// poll. v2 mirrors that by returning a 'processing' status so the TanStack poll
// keeps ticking instead of surfacing an error.
export const getGammaStatus = async (
  generationId: string,
): Promise<GammaStatus> => {
  const result = await legacyApiFetch<GammaStatus>(
    `${GAMMA_STATUS_ENDPOINT}?id=${encodeURIComponent(generationId)}`,
    { cache: 'no-store', schema: GammaStatusResponseSchema },
  )

  if (result.error !== null) {
    return {
      status: 'processing',
      gammaUrl: null,
      exportUrl: null,
      error: null,
    }
  }

  return result.data
}
