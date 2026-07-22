import {
  type IllustrationItem,
  type SocialsPlatform,
  type SocialsResult,
} from '../../types'

export interface UseSocialsGeneratorResult {
  activeSlide: number
  activeTab: SocialsPlatform
  addIllustrations: (files: FileList | null) => void
  angle: string
  audience: string
  copiedPlatform: SocialsPlatform | null
  copyText: (platform: SocialsPlatform) => void
  error: string
  exportZip: () => Promise<void>
  generateAll: () => Promise<void>
  illustrations: IllustrationItem[]
  isExporting: boolean
  loadingStates: Partial<Record<SocialsPlatform, boolean>>
  nextSlide: () => void
  prevSlide: () => void
  removeIllustration: (id: string) => void
  results: Partial<Record<SocialsPlatform, SocialsResult>> | null
  setActiveTab: (platform: SocialsPlatform) => void
  setAngle: (value: string) => void
  setAudience: (value: string) => void
  setTone: (value: string) => void
  setTopic: (value: string) => void
  tone: string
  topic: string
}

export type UseSocialsGenerator = () => UseSocialsGeneratorResult
