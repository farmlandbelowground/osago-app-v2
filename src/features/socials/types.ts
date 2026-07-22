import { type z } from 'zod'

import {
  type InstagramResponseSchema,
  type SingleVisualResponseSchema,
} from './schema'

export type SocialsPlatform = 'instagram' | 'linkedin' | 'facebook'

export interface SocialsPlatformSpec {
  h: number
  label: string
  name: string
  ratio: string
  w: number
}

export interface IllustrationItem {
  id: string
  name: string
  src: string
}

export type InstagramData = z.infer<typeof InstagramResponseSchema>
export type SingleVisualData = z.infer<typeof SingleVisualResponseSchema>

export interface SocialsResultError {
  error: true
  message: string
}

export type SocialsResult = InstagramData | SingleVisualData | SocialsResultError

export interface SocialsInputs {
  angle: string
  audience: string
  tone: string
  topic: string
}
