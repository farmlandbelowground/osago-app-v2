'use client'

import { useState, type FC } from 'react'

import { cn } from '@shared/utils/cn'

import { buildPreviewVars } from '../../lib/buildPreviewVars'
import {
  renderEmailForSending,
  renderTemplateVars,
} from '../../lib/renderTemplatePreview'
import { type PreviewMode } from '../../types'
import { MailTemplateList } from '../MailTemplateList'
import { MailTemplatePreview } from '../MailTemplatePreview'
import { type Props } from './types'

export const MailTemplateViewer: FC<Props> = ({ templates }) => {
  const [selectedId, setSelectedId] = useState<string | null>(
    templates[0]?.id ?? null,
  )
  const [mode, setMode] = useState<PreviewMode>('html')

  const selected =
    templates.find(template => template.id === selectedId) ?? templates[0]

  if (!selected) {
    return (
      <div className="card">
        <div className="empty">
          <h3>Geen template geselecteerd</h3>
          <p>Selecteer een template uit de lijst.</p>
        </div>
      </div>
    )
  }

  const previewVars = buildPreviewVars(selected)
  const preview = renderEmailForSending(selected, previewVars)

  return (
    <div
      className="grid"
      style={{
        alignItems: 'start',
        gap: 20,
        gridTemplateColumns: '320px 1fr',
      }}
    >
      <MailTemplateList
        onSelect={setSelectedId}
        selectedId={selected.id}
        templates={templates}
      />

      <div>
        <div className="card mb-4">
          <div className="flex-between mb-3">
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3>{selected.name}</h3>
              <p className="desc">{selected.description}</p>
            </div>
            <span
              className={cn(
                'badge',
                selected.enabled ? 'badge-green' : 'badge-gray',
              )}
              style={{ alignSelf: 'flex-start' }}
            >
              {selected.enabled ? 'Actief' : 'Uitgeschakeld'}
            </span>
          </div>

          {selected.availableVars.length > 0 && (
            <div className="field mb-3">
              <label>Beschikbare variabelen</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selected.availableVars.map(variable => (
                  <span
                    className="filter-chip"
                    key={variable.name}
                    style={{ cursor: 'default' }}
                    title={`Voorbeeldwaarde: ${variable.sample}`}
                  >
                    {`{{${variable.name}}}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="form-row mb-3">
            <div className="field">
              <label>Afzendernaam</label>
              <div className="email-readonly-box">
                {selected.fromName || '—'}
              </div>
            </div>
            <div className="field">
              <label>Afzender e-mailadres</label>
              <div className="email-readonly-box">
                {selected.fromEmail || '—'}
              </div>
            </div>
          </div>

          <div className="field mb-3">
            <label>BCC</label>
            <div className="email-readonly-box">{selected.bcc || '—'}</div>
          </div>

          <div className="field mb-3">
            <label>Onderwerp</label>
            <div className="email-readonly-box">{selected.subject}</div>
          </div>

          <div className="field">
            <label>Bericht</label>
            <div className="email-readonly-box email-readonly-body">
              {selected.body}
            </div>
          </div>
        </div>

        <MailTemplatePreview
          bcc={preview.bcc}
          fromEmail={preview.fromEmail}
          fromName={preview.fromName}
          html={preview.html}
          mode={mode}
          onModeChange={setMode}
          subject={renderTemplateVars(selected.subject, previewVars)}
          text={preview.text}
        />
      </div>
    </div>
  )
}
