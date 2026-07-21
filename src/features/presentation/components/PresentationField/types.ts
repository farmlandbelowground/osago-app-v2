import { type AiComposeRequest } from '@shared/ai-compose'
import { type ApiResult } from '@shared/api/fetcher'

import { type PresentationFieldDef } from '../../types'

export interface Props {
  field: PresentationFieldDef
  onAiResult: (text: string) => void
  onBlur: () => void
  onChange: (value: string) => void
  onCompose: (request: AiComposeRequest) => Promise<ApiResult<{ text: string }>>
  value: string
}
