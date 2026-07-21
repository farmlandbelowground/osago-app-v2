'use server'

import { revalidatePath } from 'next/cache'

import { env } from '@/env'
import {
  DOCUMENTENKLUIS_PATH,
  logSelfGeneratedDocument,
} from '@features/documents'
import { type ApiResult } from '@shared/api/fetcher'
import { legacyApiFetch } from '@shared/api/legacyApiFetch'
import { requireSession } from '@shared/auth/session'
import { getServerClient } from '@shared/supabase/server'

import {
  GAMMA_DOWNLOAD_ENDPOINT,
  GAMMA_DOWNLOAD_ERROR,
  GAMMA_GENERATE_ENDPOINT,
  GAMMA_GENERIC_ERROR,
  PPTX_MIME,
} from './constants'
import { GammaGenerateResponseSchema } from './schema'
import { type GammaVariant } from './types'

interface StartGammaGenerationInput {
  inputText: string
  numCards: number
  variant: GammaVariant
}

// Ports the generate call of generateViaGamma (osago-bundle.js:19727-19735):
// always pptx + textMode 'preserve'. The frozen endpoint returns a flat
// `{ error }` body, so any failure collapses to the generic fallback (spec §3.2).
export const startGammaGeneration = async (
  input: StartGammaGenerationInput,
): Promise<ApiResult<{ generationId: string }>> => {
  const result = await legacyApiFetch<{ generationId: string }>(
    GAMMA_GENERATE_ENDPOINT,
    {
      method: 'POST',
      body: JSON.stringify({
        inputText: input.inputText,
        variant: input.variant,
        exportAs: 'pptx',
        textMode: 'preserve',
        numCards: input.numCards,
      }),
      schema: GammaGenerateResponseSchema,
    },
  )

  if (result.error !== null) {
    return { data: null, error: GAMMA_GENERIC_ERROR }
  }

  return { data: { generationId: result.data.generationId }, error: null }
}

interface FinalizeGammaDocumentInput {
  description: string
  fileName: string
  generationId: string
}

// Ports the download → save-to-vault step of generateViaGamma
// (osago-bundle.js:19760-19780). The download endpoint returns raw file bytes
// (not JSON), so it cannot go through apiFetch — a raw bearer fetch reads the
// arrayBuffer, then logSelfGeneratedDocument writes the pptx into the vault.
export const finalizeGammaDocument = async (
  input: FinalizeGammaDocumentInput,
): Promise<ApiResult<{ documentId: string }>> => {
  await requireSession()

  const supabase = await getServerClient()
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  if (!accessToken) {
    return { data: null, error: GAMMA_DOWNLOAD_ERROR }
  }

  const url = `${env.APP_URL}${GAMMA_DOWNLOAD_ENDPOINT}?id=${encodeURIComponent(input.generationId)}`

  let response: Response
  try {
    response = await fetch(url, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  } catch {
    return { data: null, error: GAMMA_DOWNLOAD_ERROR }
  }

  if (!response.ok) {
    return { data: null, error: GAMMA_DOWNLOAD_ERROR }
  }

  const bytes = Buffer.from(await response.arrayBuffer())

  const stored = await logSelfGeneratedDocument({
    description: input.description,
    fileBase64: bytes.toString('base64'),
    fileName: input.fileName,
    fileType: PPTX_MIME,
  })

  if (stored.error !== null) {
    return { data: null, error: GAMMA_DOWNLOAD_ERROR }
  }

  revalidatePath(DOCUMENTENKLUIS_PATH)
  return { data: { documentId: stored.data.id }, error: null }
}
