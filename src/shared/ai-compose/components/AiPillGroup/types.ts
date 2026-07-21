import { type ApiResult } from '@shared/api/fetcher'

import { type AiComposeAction, type AiComposeLength } from '../../types'

export interface AiComposeRequest {
  action: AiComposeAction
  currentValue: string
  length: AiComposeLength
  instruction?: string
}

export interface Props {
  currentValue: string
  onCompose: (request: AiComposeRequest) => Promise<ApiResult<{ text: string }>>
  onResult: (text: string) => void
}
