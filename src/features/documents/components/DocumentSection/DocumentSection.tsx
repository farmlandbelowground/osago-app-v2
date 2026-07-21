import { type FC } from 'react'

import { DocumentRow } from '../DocumentRow'
import { type Props } from './types'

// Ports renderDocSection (osago-bundle.js:6799-6838).
export const DocumentSection: FC<Props> = ({
  documents,
  emptyMessage,
  metaLabel,
  subtitle,
  title,
}) => {
  return (
    <div className="card mb-5">
      <div
        className="flex-between mb-3"
        style={{ flexWrap: 'wrap', gap: '8px' }}
      >
        <div>
          <h3>{title}</h3>
          <p className="desc" style={{ marginBottom: 0 }}>
            {subtitle}
          </p>
        </div>
        {documents.length > 0 && (
          <span className="badge badge-gray">
            {documents.length}{' '}
            {documents.length === 1 ? 'document' : 'documenten'}
          </span>
        )}
      </div>

      {documents.length === 0 ? (
        <p className="text-muted text-sm" style={{ margin: '8px 0 0' }}>
          {emptyMessage}
        </p>
      ) : (
        <div className="doc-list">
          {documents.map(document => (
            <DocumentRow
              document={document}
              key={document.id}
              metaLabel={metaLabel}
            />
          ))}
        </div>
      )}
    </div>
  )
}
