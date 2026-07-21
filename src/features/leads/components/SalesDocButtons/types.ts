import { type LeadStage } from '../../types'

export interface Props {
  hasCompanyName: boolean
  leadId: string
  // Persists the open modal's edits before generating, so the document reflects
  // the current form values (ports the pre-generation save in generateNda etc.).
  persistEdits: () => Promise<boolean>
  stage: LeadStage
}
