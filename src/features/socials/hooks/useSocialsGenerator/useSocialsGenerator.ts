'use client'

import { useState } from 'react'

import { generateSocialPost } from '../../actions'
import {
  COPY_CLEAR_MS,
  SOCIALS_DEFAULT_AUDIENCE,
  SOCIALS_DEFAULT_TONE,
  SOCIALS_PLATFORMS,
} from '../../constants'
import {
  buildSocialsMessage,
  buildSocialsUserBase,
  parseSocialsJson,
  SOCIALS_BRAND_CONTEXT,
} from '../../lib/buildSocialsPrompt'
import { exportSocialsZip } from '../../lib/exportSocialsZip'
import {
  InstagramResponseSchema,
  SingleVisualResponseSchema,
} from '../../schema'
import {
  type IllustrationItem,
  type SocialsPlatform,
  type SocialsResult,
} from '../../types'
import { type UseSocialsGeneratorResult } from './types'

const generateForPlatform = async (
  platform: SocialsPlatform,
  brandContext: string,
  userBase: string,
): Promise<SocialsResult> => {
  const { error, text } = await generateSocialPost(
    buildSocialsMessage(platform, brandContext, userBase),
  )

  if (error !== null || text === null) {
    return { error: true, message: error ?? 'Onbekende fout' }
  }

  const parsed = parseSocialsJson(text)
  const schema =
    platform === 'instagram'
      ? InstagramResponseSchema
      : SingleVisualResponseSchema
  const validated = schema.safeParse(parsed)

  if (!validated.success) {
    return { error: true, message: 'Model gaf geen geldige JSON terug.' }
  }

  return validated.data
}

export const useSocialsGenerator = (): UseSocialsGeneratorResult => {
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState(SOCIALS_DEFAULT_TONE)
  const [audience, setAudience] = useState(SOCIALS_DEFAULT_AUDIENCE)
  const [angle, setAngle] = useState('')
  const [illustrations, setIllustrations] = useState<IllustrationItem[]>([])
  const [results, setResults] = useState<Partial<
    Record<SocialsPlatform, SocialsResult>
  > | null>(null)
  const [loadingStates, setLoadingStates] = useState<
    Partial<Record<SocialsPlatform, boolean>>
  >({})
  const [error, setError] = useState('')
  const [activeTab, setActiveTabState] = useState<SocialsPlatform>('instagram')
  const [activeSlide, setActiveSlide] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [copiedPlatform, setCopiedPlatform] = useState<SocialsPlatform | null>(
    null,
  )

  const addIllustrations = (files: FileList | null): void => {
    if (!files) {
      return
    }
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = event => {
        const src = event.target?.result
        if (typeof src === 'string') {
          setIllustrations(current => [
            ...current,
            { id: crypto.randomUUID(), name: file.name, src },
          ])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeIllustration = (id: string): void => {
    setIllustrations(current => current.filter(item => item.id !== id))
  }

  const setActiveTab = (platform: SocialsPlatform): void => {
    setActiveTabState(platform)
    setActiveSlide(0)
  }

  const prevSlide = (): void => {
    setActiveSlide(current => Math.max(0, current - 1))
  }

  const nextSlide = (): void => {
    const instagram = results?.instagram
    const total =
      instagram && !('error' in instagram) && 'slides' in instagram
        ? instagram.slides.length
        : 0
    setActiveSlide(current => Math.min(total - 1, current + 1))
  }

  const generateAll = async (): Promise<void> => {
    if (!topic.trim()) {
      setError('Vul eerst een onderwerp in')
      return
    }
    setError('')
    setResults(null)
    setActiveSlide(0)
    setActiveTabState('instagram')
    setLoadingStates({ facebook: true, instagram: true, linkedin: true })

    const brandContext = SOCIALS_BRAND_CONTEXT
    const userBase = buildSocialsUserBase(
      { angle, audience, tone, topic },
      illustrations,
    )

    const collected: Partial<Record<SocialsPlatform, SocialsResult>> = {}
    await Promise.all(
      SOCIALS_PLATFORMS.map(async platform => {
        try {
          const data = await generateForPlatform(platform, brandContext, userBase)
          collected[platform] = data
          setResults(current => ({ ...(current ?? {}), [platform]: data }))
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Onbekende fout'
          collected[platform] = { error: true, message }
          setResults(current => ({
            ...(current ?? {}),
            [platform]: { error: true, message },
          }))
        } finally {
          setLoadingStates(current => ({ ...current, [platform]: false }))
        }
      }),
    )

    const allFailed = SOCIALS_PLATFORMS.every(
      platform => collected[platform] && 'error' in collected[platform],
    )
    if (allFailed) {
      const first = SOCIALS_PLATFORMS.map(platform => collected[platform]).find(
        entry => entry && 'error' in entry,
      )
      setError(
        first && 'error' in first
          ? `Genereren mislukt: ${first.message}`
          : 'Genereren mislukt voor alle platforms. Probeer het opnieuw.',
      )
    }
  }

  const copyText = (platform: SocialsPlatform): void => {
    const result = results?.[platform]
    if (!result || 'error' in result) {
      return
    }
    const text = 'caption' in result ? result.caption : result.post
    if (!text) {
      return
    }
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).catch(() => undefined)
    }
    setCopiedPlatform(platform)
    setTimeout(() => {
      setCopiedPlatform(current => (current === platform ? null : current))
    }, COPY_CLEAR_MS)
  }

  const exportZip = async (): Promise<void> => {
    if (!results) {
      return
    }
    setIsExporting(true)
    try {
      await exportSocialsZip({
        illustrations,
        inputs: { angle, audience, tone, topic },
        results,
      })
    } catch {
      setError('Export mislukt — probeer opnieuw.')
    } finally {
      setIsExporting(false)
    }
  }

  return {
    activeSlide,
    activeTab,
    addIllustrations,
    angle,
    audience,
    copiedPlatform,
    copyText,
    error,
    exportZip,
    generateAll,
    illustrations,
    isExporting,
    loadingStates,
    nextSlide,
    prevSlide,
    removeIllustration,
    results,
    setActiveTab,
    setAngle,
    setAudience,
    setTone,
    setTopic,
    tone,
    topic,
  }
}
