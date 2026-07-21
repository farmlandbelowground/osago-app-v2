'use client'

import { useTransition, type FC } from 'react'

import { useToastStore } from '@shared/store/toast'

import { createDocumentDownloadUrl } from '../../actions'
import { type Props } from './types'

export const DocumentDownloadButton: FC<Props> = ({ documentId }) => {
  const [isPending, startTransition] = useTransition()
  const showToast = useToastStore(state => state.showToast)

  const onDownload = (): void => {
    startTransition(async () => {
      const result = await createDocumentDownloadUrl(documentId)

      if (result.error !== null) {
        showToast(result.error, 'error')
        return
      }

      window.open(result.data.url, '_blank', 'noopener')
    })
  }

  return (
    <button
      className="btn btn-secondary btn-sm"
      disabled={isPending}
      onClick={onDownload}
      style={{ whiteSpace: 'nowrap' }}
      type="button"
    >
      <svg
        fill="none"
        height="13"
        stroke="currentColor"
        strokeWidth="2"
        style={{ marginRight: '4px', verticalAlign: '-2px' }}
        viewBox="0 0 24 24"
        width="13"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
      {isPending ? 'Bezig…' : 'Download'}
    </button>
  )
}
