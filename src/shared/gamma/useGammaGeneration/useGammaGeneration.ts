'use client'

import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import { finalizeGammaDocument, startGammaGeneration } from '../actions'
import {
  GAMMA_FAILED_ERROR,
  GAMMA_POLL_INTERVAL_MS,
  GAMMA_STATUS_QUERY_KEY,
  GAMMA_TIMEOUT_ERROR,
  GAMMA_TIMEOUT_MS,
} from '../constants'
import { getGammaStatus } from '../status'
import { type GammaPhase, type GammaRunInput } from '../types'
import { type UseGammaGeneration } from './types'

const MS_PER_SECOND = 1000

type FinalizeStatus = 'idle' | 'saving' | 'done' | 'error'

// Client-side orchestrator for the shared Gamma flow (OQ-1 = TanStack
// refetchInterval). run() starts the generation, a polling query drives the
// status, and 'completed' triggers the finalize (download → vault) step. The
// phase is DERIVED from the query + finalize state (not stored) so no effect
// sets state synchronously. Ports the timing of generateViaGamma
// (osago-bundle.js:19705-19820).
export const useGammaGeneration: UseGammaGeneration = () => {
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [finalizeStatus, setFinalizeStatus] = useState<FinalizeStatus>('idle')
  const [finalizeError, setFinalizeError] = useState<string | null>(null)
  const [storedDocumentId, setStoredDocumentId] = useState<string | null>(null)

  const runInputRef = useRef<GammaRunInput | null>(null)
  const startedAtRef = useRef(0)
  const finalizeStartedRef = useRef(false)

  const { data: status } = useQuery({
    enabled:
      generationId !== null && finalizeStatus === 'idle' && startError === null,
    gcTime: 0,
    queryFn: () => getGammaStatus(generationId as string),
    queryKey: [GAMMA_STATUS_QUERY_KEY, generationId],
    refetchInterval: query => {
      const current = query.state.data?.status
      if (current === 'completed' || current === 'failed') {
        return false
      }
      return GAMMA_POLL_INTERVAL_MS
    },
    refetchOnWindowFocus: false,
  })

  const gammaStatus = status?.status ?? null

  const timedOut =
    generationId !== null &&
    finalizeStatus === 'idle' &&
    elapsedSeconds * MS_PER_SECOND > GAMMA_TIMEOUT_MS

  const runFinalize = useCallback(async (): Promise<void> => {
    const input = runInputRef.current
    if (!input || generationId === null) {
      return
    }
    setFinalizeStatus('saving')
    const result = await finalizeGammaDocument({
      description: input.description,
      fileName: input.fileName,
      generationId,
    })
    if (result.error !== null) {
      setFinalizeError(result.error)
      setFinalizeStatus('error')
      return
    }
    setStoredDocumentId(result.data.documentId)
    setFinalizeStatus('done')
  }, [generationId])

  useEffect(() => {
    if (gammaStatus !== 'completed' || finalizeStartedRef.current) {
      return
    }
    finalizeStartedRef.current = true
    void runFinalize()
  }, [gammaStatus, runFinalize])

  useEffect(() => {
    const shouldTick =
      generationId !== null &&
      finalizeStatus === 'idle' &&
      gammaStatus !== 'completed' &&
      gammaStatus !== 'failed' &&
      !timedOut
    if (!shouldTick) {
      return
    }
    const interval = setInterval(() => {
      setElapsedSeconds(
        Math.round((Date.now() - startedAtRef.current) / MS_PER_SECOND),
      )
    }, MS_PER_SECOND)
    return () => clearInterval(interval)
  }, [generationId, finalizeStatus, gammaStatus, timedOut])

  const run = useCallback(async (input: GammaRunInput): Promise<void> => {
    runInputRef.current = input
    finalizeStartedRef.current = false
    setStartError(null)
    setFinalizeError(null)
    setFinalizeStatus('idle')
    setStoredDocumentId(null)
    setElapsedSeconds(0)
    setGenerationId(null)
    setIsStarting(true)

    const result = await startGammaGeneration({
      inputText: input.inputText,
      numCards: input.numCards,
      variant: input.variant,
    })

    setIsStarting(false)
    if (result.error !== null) {
      setStartError(result.error)
      return
    }
    startedAtRef.current = Date.now()
    setGenerationId(result.data.generationId)
  }, [])

  const reset = useCallback((): void => {
    runInputRef.current = null
    finalizeStartedRef.current = false
    setGenerationId(null)
    setIsStarting(false)
    setStartError(null)
    setFinalizeStatus('idle')
    setFinalizeError(null)
    setStoredDocumentId(null)
    setElapsedSeconds(0)
  }, [])

  let phase: GammaPhase = 'idle'
  if (finalizeStatus === 'done') {
    phase = 'done'
  } else if (finalizeStatus === 'saving') {
    phase = 'saving'
  } else if (
    finalizeStatus === 'error' ||
    startError !== null ||
    gammaStatus === 'failed' ||
    timedOut
  ) {
    phase = 'error'
  } else if (isStarting) {
    phase = 'starting'
  } else if (generationId !== null) {
    phase = 'generating'
  }

  const error =
    startError ??
    finalizeError ??
    (gammaStatus === 'failed'
      ? (status?.error ?? GAMMA_FAILED_ERROR)
      : timedOut
        ? GAMMA_TIMEOUT_ERROR
        : null)

  return { elapsedSeconds, error, phase, reset, run, storedDocumentId }
}
