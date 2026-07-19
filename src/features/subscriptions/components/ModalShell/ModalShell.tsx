'use client'

import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import { type Props } from './types'

export const ModalShell: FC<Props> = ({
  children,
  footer,
  maxWidthClassName,
  onClose,
  title,
}) => {
  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div
        className={cn('modal', maxWidthClassName)}
        onClick={event => event.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{title}</h3>
          <button
            aria-label="Sluiten"
            className="modal-close"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
