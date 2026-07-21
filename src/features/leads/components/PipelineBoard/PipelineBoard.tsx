'use client'

import { useRef, useState, useTransition, type FC, type ReactNode } from 'react'

import { useToastStore } from '@shared/store/toast'
import { cn } from '@shared/utils/cn'

import { moveLeadStage } from '../../actions'
import {
  DRAG_CLICK_SUPPRESS_MS,
  LEAD_STAGES,
  type LeadStageDefinition,
} from '../../constants/stages'
import { buyerDisplayName } from '../../lib/buyerDisplayName'
import {
  fitBadgeClass,
  resolveBoardStage,
  stageLabel,
} from '../../lib/stageMapping'
import { type Lead, type LeadStage } from '../../types'
import { OsagoBadge } from '../OsagoBadge'
import { PipelineDetailModal } from '../PipelineDetailModal'
import { type Props } from './types'

// Ports renderPipeline + bindPipeline (osago-bundle.js:21512-21641): six stage
// columns with count badges, HTML5 drag-and-drop between columns, and a
// click-to-open detail modal (suppressed right after a drop).
export const PipelineBoard: FC<Props> = ({ companyHasName, leads }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null)
  const justDropped = useRef(false)
  const [, startTransition] = useTransition()
  const showToast = useToastStore(state => state.showToast)

  const selectedLead = leads.find(lead => lead.id === selectedId) ?? null

  const grouped = (stage: LeadStage): Lead[] =>
    leads.filter(lead => resolveBoardStage(lead.stage) === stage)

  const onDrop = (stage: LeadStage): void => {
    setDragOverStage(null)
    const id = draggedId
    setDraggedId(null)
    if (!id) {
      return
    }
    const lead = leads.find(entry => entry.id === id)
    if (!lead || resolveBoardStage(lead.stage) === stage) {
      return
    }

    justDropped.current = true
    window.setTimeout(() => {
      justDropped.current = false
    }, DRAG_CLICK_SUPPRESS_MS)

    startTransition(async () => {
      const result = await moveLeadStage(id, stage)
      if (result.error !== null) {
        showToast(result.error, 'error')
        return
      }
      showToast(
        `${buyerDisplayName(lead)} verplaatst naar ${stageLabel(stage)}`,
      )
    })
  }

  const renderColumn = (definition: LeadStageDefinition): ReactNode => {
    const columnLeads = grouped(definition.id)
    return (
      <div
        className={cn(
          'pipeline-col',
          dragOverStage === definition.id && 'drag-over',
        )}
        key={definition.id}
        onDragLeave={() => setDragOverStage(null)}
        onDragOver={event => {
          event.preventDefault()
          setDragOverStage(definition.id)
        }}
        onDrop={() => onDrop(definition.id)}
      >
        <div className="pipeline-col-header">
          <div className="pipeline-col-title">{definition.label}</div>
          <span className="pipeline-count">{columnLeads.length}</span>
        </div>
        {columnLeads.length === 0 ? (
          <div className="pipeline-empty-hint">Sleep een koper hierheen</div>
        ) : (
          columnLeads.map(lead => (
            <div
              className={cn(
                'pipeline-card',
                draggedId === lead.id && 'dragging',
              )}
              draggable
              key={lead.id}
              onClick={() => {
                if (!justDropped.current) {
                  setSelectedId(lead.id)
                }
              }}
              onDragEnd={() => {
                setDraggedId(null)
                setDragOverStage(null)
              }}
              onDragStart={event => {
                setDraggedId(lead.id)
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', lead.id)
              }}
            >
              <div className="pc-name">{buyerDisplayName(lead)}</div>
              <div className="pc-meta">
                <span className={cn('badge', fitBadgeClass(lead.fitScore))}>
                  {lead.fitScore ?? 0}% fit
                </span>
              </div>
              {lead.contactLegacy && lead.name && (
                <div className="text-xs text-muted mt-2">
                  👤 {lead.contactLegacy}
                </div>
              )}
              {lead.validatedByOsago && (
                <div style={{ marginTop: '8px' }}>
                  <OsagoBadge lead={lead} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <>
      <div className="pipeline">{LEAD_STAGES.map(renderColumn)}</div>

      {selectedLead && (
        <PipelineDetailModal
          companyHasName={companyHasName}
          lead={selectedLead}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  )
}
