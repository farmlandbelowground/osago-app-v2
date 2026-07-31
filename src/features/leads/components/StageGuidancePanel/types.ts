import { type LeadStageDefinition } from '../../constants/stages'
import { type LeadStage } from '../../types'

export interface Props {
  initialChecked: Record<string, boolean>
  leadId: string
  onStageChange: (stage: LeadStage) => void
  stage: LeadStage
  stageDefinitions: readonly LeadStageDefinition[]
}
