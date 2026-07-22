import { type UseSocialsGeneratorResult } from '../../hooks/useSocialsGenerator'
import { type SingleVisualData, type SocialsPlatform } from '../../types'

export interface Props {
  generated: SingleVisualData
  platform: SocialsPlatform
  socials: UseSocialsGeneratorResult
}
