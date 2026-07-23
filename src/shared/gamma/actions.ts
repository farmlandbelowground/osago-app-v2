'use server'

import { revalidatePath } from 'next/cache'

import { env } from '@/env'
import {
  DOCUMENTENKLUIS_PATH,
  logSelfGeneratedDocument,
} from '@features/documents'
import { type ApiResult } from '@shared/api/fetcher'
import { legacyApiFetch } from '@shared/api/legacyApiFetch'
import { type AuthSession, requireSession } from '@shared/auth/session'
import { getServerClient } from '@shared/supabase/server'

import {
  GAMMA_DOWNLOAD_ENDPOINT,
  GAMMA_DOWNLOAD_ERROR,
  GAMMA_GENERATE_ENDPOINT,
  GAMMA_GENERIC_ERROR,
  PPTX_MIME,
} from './constants'
import { applyPlacementPlan, type PhotoSourceResolver } from './inject'
import { GammaGenerateResponseSchema } from './schema'
import {
  type GammaGenerateOptions,
  type GammaPlacementPlan,
  type GammaVariant,
} from './types'

type SupabaseServerClient = Awaited<ReturnType<typeof getServerClient>>

// Resolves a photo placement source to a fetchable URL. The uploaded photos are
// base64 data URLs stored inline in companies.extra.presentationImages, far too
// large to pass through the server-action body — so we read them here (once,
// cached) rather than in the placement plan. The profile photo is on the session.
const createPhotoResolver = (
  supabase: SupabaseServerClient,
  session: AuthSession,
): PhotoSourceResolver => {
  let imagesCache: Record<string, unknown> | null | undefined

  const loadImages = async (): Promise<Record<string, unknown> | null> => {
    if (imagesCache === undefined) {
      const { data } = await supabase
        .from('companies')
        .select('extra')
        .eq('user_id', session.user.id)
        .maybeSingle()
      const extra: unknown = data?.extra
      const images =
        extra && typeof extra === 'object'
          ? (extra as Record<string, unknown>).presentationImages
          : null
      imagesCache =
        images && typeof images === 'object'
          ? (images as Record<string, unknown>)
          : null
    }
    return imagesCache
  }

  return async source => {
    if ('profile' in source) {
      return session.photo ?? null
    }
    const images = await loadImages()
    const list = images?.[source.tab]
    if (!Array.isArray(list) || list.length === 0) {
      return null
    }
    const first: unknown = list[0]
    const fullUrl =
      first && typeof first === 'object'
        ? (first as Record<string, unknown>).fullUrl
        : null
    return typeof fullUrl === 'string' && fullUrl ? fullUrl : null
  }
}

interface StartGammaGenerationInput {
  inputText: string
  numCards: number
  variant: GammaVariant
  options?: GammaGenerateOptions
}

// Ports the generate call of generateViaGamma (osago-bundle.js:19727-19735) +
// the #65/#70 fixed-template params. Without `options` the legacy pptx behavior
// is unchanged; with it, the fixed-template PDF flow (exportAs 'pdf',
// fixedTemplate, imageOptions, cardSplit, reserveRightHalf, themeId) is sent.
// The frozen endpoint returns a flat `{ error }` body, so any failure collapses
// to the generic fallback (spec §3.2).
export const startGammaGeneration = async (
  input: StartGammaGenerationInput,
): Promise<ApiResult<{ generationId: string }>> => {
  const options = input.options
  const result = await legacyApiFetch<{ generationId: string }>(
    GAMMA_GENERATE_ENDPOINT,
    {
      method: 'POST',
      body: JSON.stringify({
        inputText: input.inputText,
        variant: input.variant,
        exportAs: options?.exportAs ?? 'pptx',
        textMode: 'preserve',
        numCards: input.numCards,
        ...(options?.fixedTemplate === true ? { fixedTemplate: true } : {}),
        ...(options?.imageSource
          ? { imageOptions: { source: options.imageSource } }
          : {}),
        ...(options?.cardSplit ? { cardSplit: options.cardSplit } : {}),
        ...(options?.reserveRightHalf === true
          ? { reserveRightHalf: true }
          : {}),
        ...(options?.themeId ? { themeId: options.themeId } : {}),
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
  fileType?: string
  placementPlan?: GammaPlacementPlan
}

// Ports the download → (inject) → save-to-vault step of generateViaGamma /
// generateValuationViaGamma (osago-bundle.js:19760-19780 + #65/#70). The download
// endpoint returns raw file bytes (not JSON), so it cannot go through apiFetch —
// a raw bearer fetch reads the arrayBuffer. For the fixed-template PDF flow, our
// own photos/components are then injected server-side (placementPlan) before the
// vault write. An injection failure never breaks generation: it falls back to
// the un-injected PDF (matches legacy's try/catch around injectImagesIntoPdf).
export const finalizeGammaDocument = async (
  input: FinalizeGammaDocumentInput,
): Promise<ApiResult<{ documentId: string }>> => {
  const session = await requireSession()

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

  let bytes = Buffer.from(await response.arrayBuffer())

  if (input.placementPlan) {
    try {
      const injected = await applyPlacementPlan(
        new Uint8Array(bytes),
        input.placementPlan,
        createPhotoResolver(supabase, session),
      )
      bytes = Buffer.from(injected)
    } catch (err) {
      console.warn(
        '[Gamma] injectie mislukt — PDF zonder injectie opgeslagen:',
        err,
      )
    }
  }

  const stored = await logSelfGeneratedDocument({
    description: input.description,
    fileBase64: bytes.toString('base64'),
    fileName: input.fileName,
    fileType: input.fileType ?? PPTX_MIME,
  })

  if (stored.error !== null) {
    return { data: null, error: GAMMA_DOWNLOAD_ERROR }
  }

  revalidatePath(DOCUMENTENKLUIS_PATH)
  return { data: { documentId: stored.data.id }, error: null }
}
