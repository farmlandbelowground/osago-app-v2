'use client'

import { useState, useTransition, type FC } from 'react'

import { useToastStore } from '@shared/store/toast'

import { toggleStageAction } from '../../actions'
import {
  STAGE_GUIDANCE,
  type ChecklistItem,
} from '../../constants/stageGuidance'
import { type LeadStage } from '../../types'
import { type Props } from './types'

// Green stage-info panel inside PipelineDetailModal. Content is stage-driven
// (osago-content-processtappen.docx). Check state is persisted per buyer ×
// per stage × per item via `toggleStageAction`, so vinkjes overleven modal
// close. The map is seeded from `initialChecked` (the lead's persisted state)
// and updated optimistically — a server error rolls the toggle back and shows
// a toast.
//
// The forward-action:
//   - stages with `nextStage` → "Naar volgende fase" button
//   - `no_interest` (`backStage`) → "Terugzetten naar {stage}" button
//   - `closing` → no button (terminal)

const stageLabel = (
  stage: LeadStage,
  definitions: Props['stageDefinitions'],
): string => definitions.find(d => d.id === stage)?.label ?? stage

const InfoTip: FC<{ tip: string }> = ({ tip }) => (
  <span
    aria-label={tip}
    className="info-tip"
    data-tip={tip}
    style={{ marginLeft: 6 }}
    tabIndex={0}
  >
    i
  </span>
)

const CheckIcon: FC = () => (
  <svg
    fill="none"
    height="10"
    stroke="currentColor"
    strokeWidth="3.2"
    viewBox="0 0 24 24"
    width="10"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const ArrowIcon: FC = () => (
  <svg
    fill="none"
    height="12"
    stroke="currentColor"
    strokeWidth="2"
    style={{ marginLeft: 4, verticalAlign: -2 }}
    viewBox="0 0 24 24"
    width="12"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

interface CheckListProps {
  checkedMap: Record<string, boolean>
  items: ChecklistItem[]
  keyPrefix: string
  onToggle: (itemKey: string) => void
}

const CheckList: FC<CheckListProps> = ({
  checkedMap,
  items,
  keyPrefix,
  onToggle,
}) => (
  <div className="check-list">
    {items.map(item => {
      const key = `${keyPrefix}:${item.id}`
      const isDone = !!checkedMap[key]
      return (
        <button
          className={`check-item${isDone ? ' done' : ''}`}
          key={item.id}
          onClick={() => onToggle(key)}
          type="button"
        >
          <span className="check-box">
            <CheckIcon />
          </span>
          <span className="ct">
            {item.text}
            {item.tip && <InfoTip tip={item.tip} />}
          </span>
        </button>
      )
    })}
  </div>
)

export const StageGuidancePanel: FC<Props> = ({
  initialChecked,
  leadId,
  onStageChange,
  stage,
  stageDefinitions,
}) => {
  const guidance = STAGE_GUIDANCE[stage]
  const [checkedMap, setCheckedMap] =
    useState<Record<string, boolean>>(initialChecked)
  const [, startTransition] = useTransition()
  const showToast = useToastStore(state => state.showToast)

  const toggle = (key: string): void => {
    const nextChecked = !checkedMap[key]
    const previous = checkedMap
    const optimistic = { ...previous }
    if (nextChecked) {
      optimistic[key] = true
    } else {
      delete optimistic[key]
    }
    setCheckedMap(optimistic)

    startTransition(async () => {
      const result = await toggleStageAction(leadId, key, nextChecked)
      if (result.error !== null) {
        setCheckedMap(previous)
        showToast(result.error, 'error')
      }
    })
  }

  return (
    <div className="step-info">
      <div className="step-info-head">
        <span className="step-info-badge">Fase</span>
        <span className="step-info-title">
          {stageLabel(stage, stageDefinitions)}
        </span>
      </div>

      <div className="step-block">
        <div className="step-block-q">Wat doe je in deze stap?</div>
        <div className="step-block-a">
          <CheckList
            checkedMap={checkedMap}
            items={guidance.actions}
            keyPrefix={`${stage}:actions`}
            onToggle={toggle}
          />
        </div>
      </div>

      <div className="step-block">
        <div className="step-block-q">
          Welke documenten verstrek je in deze stap?
        </div>
        <div className="step-block-a">
          {guidance.docs.length > 0 ? (
            <CheckList
              checkedMap={checkedMap}
              items={guidance.docs}
              keyPrefix={`${stage}:docs`}
              onToggle={toggle}
            />
          ) : (
            <span className="step-block-empty">{guidance.docsNone}</span>
          )}
        </div>
      </div>

      <div className="step-next">
        <span className="step-next-text">{guidance.transition}</span>
        {guidance.nextStage && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onStageChange(guidance.nextStage as LeadStage)}
            type="button"
          >
            Naar volgende fase
            <ArrowIcon />
          </button>
        )}
        {guidance.backStage && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onStageChange(guidance.backStage as LeadStage)}
            type="button"
          >
            Terugzetten naar {stageLabel(guidance.backStage, stageDefinitions)}
          </button>
        )}
      </div>
    </div>
  )
}
