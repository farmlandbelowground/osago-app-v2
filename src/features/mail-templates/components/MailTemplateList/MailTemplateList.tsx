'use client'

import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import { type EmailTemplate } from '../../schema'
import { type Props } from './types'

export const MailTemplateList: FC<Props> = ({
  onSelect,
  selectedId,
  templates,
}) => {
  // Group by category in first-appearance order (legacy renderAdminEmailTemplates).
  const grouped = new Map<string, EmailTemplate[]>()

  for (const template of templates) {
    const bucket = grouped.get(template.category) ?? []
    bucket.push(template)
    grouped.set(template.category, bucket)
  }

  return (
    <div className="card email-tpl-list">
      {[...grouped.entries()].map(([category, items]) => (
        <div key={category}>
          <div className="email-tpl-group">{category}</div>
          {items.map(template => (
            <div
              className={cn(
                'email-tpl-row',
                template.id === selectedId && 'active',
              )}
              key={template.id}
              onClick={() => onSelect(template.id)}
            >
              <div className="email-tpl-row-main">
                <div className="email-tpl-name">{template.name}</div>
                <div className="text-xs text-muted email-tpl-desc">
                  {template.description}
                </div>
              </div>
              {!template.enabled && <span className="badge badge-gray">Uit</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
