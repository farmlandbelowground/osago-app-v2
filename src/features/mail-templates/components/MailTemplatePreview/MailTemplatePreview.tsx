'use client'

import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import { PREVIEW_MODE_HTML, PREVIEW_MODE_TEXT, PREVIEW_RECIPIENT } from '../../constants'
import { type Props } from './types'

export const MailTemplatePreview: FC<Props> = ({
  bcc,
  fromEmail,
  fromName,
  html,
  mode,
  onModeChange,
  subject,
  text,
}) => {
  const isHtml = mode === PREVIEW_MODE_HTML

  return (
    <div className="card" style={{ background: '#FAFBFA' }}>
      <div className="flex-between mb-3">
        <div>
          <h3>Live preview</h3>
          <p className="desc">
            Hoe de mail er bij verzending uitziet, met voorbeeld-data ingevuld.
          </p>
        </div>
        <div style={{ display: 'flex', flexShrink: 0, gap: 6 }}>
          <button
            className={cn('filter-chip', isHtml && 'active')}
            onClick={() => onModeChange(PREVIEW_MODE_HTML)}
            type="button"
          >
            Opgemaakte e-mail
          </button>
          <button
            className={cn('filter-chip', !isHtml && 'active')}
            onClick={() => onModeChange(PREVIEW_MODE_TEXT)}
            type="button"
          >
            Platte tekst
          </button>
        </div>
      </div>
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}
      >
        <div className="email-preview-head">
          <div>
            <strong>Van:</strong> {fromName} &lt;{fromEmail}&gt;
          </div>
          <div>
            <strong>Aan:</strong> {PREVIEW_RECIPIENT}
          </div>
          {bcc && (
            <div>
              <strong>BCC:</strong> {bcc}
            </div>
          )}
          <div>
            <strong>Onderwerp:</strong> {subject}
          </div>
        </div>
        {isHtml ? (
          <iframe
            className="email-preview-iframe"
            srcDoc={html}
            title="HTML preview"
          />
        ) : (
          <div className="email-preview-text">{text}</div>
        )}
      </div>
    </div>
  )
}
