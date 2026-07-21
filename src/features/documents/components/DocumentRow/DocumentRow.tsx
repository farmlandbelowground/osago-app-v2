import { type FC } from 'react'

import { fileIcon } from '../../lib/fileIcon'
import { formatDocumentDate } from '../../lib/formatDocumentDate'
import { formatFileSize } from '../../lib/formatFileSize'
import { sanitizeDocumentDescription } from '../../lib/sanitizeDocumentDescription'
import { DocumentDownloadButton } from '../DocumentDownloadButton'
import { type Props } from './types'

// Ports one .doc-item row from renderDocSection (osago-bundle.js:6820-6832).
export const DocumentRow: FC<Props> = ({ document, metaLabel }) => {
  const icon = fileIcon(document.fileType, document.fileName)
  const safeDescription = sanitizeDocumentDescription(document.description)

  return (
    <div className="doc-item">
      <div className="doc-icon" style={{ background: icon.color }}>
        {icon.label}
      </div>
      <div className="doc-info">
        <div className="doc-name">{document.fileName}</div>
        <div className="doc-meta">
          {formatFileSize(document.fileSize)} · {metaLabel}{' '}
          {formatDocumentDate(document.uploadedAt)}
          {safeDescription ? ` · ${safeDescription}` : ''}
        </div>
      </div>
      <DocumentDownloadButton documentId={document.id} />
    </div>
  )
}
