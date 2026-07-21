'use client'

import { useState, type FC } from 'react'

import { useUnsplashSearch } from '../../hooks/useUnsplashSearch'
import { type PresentationPhoto, type UnsplashSearchResult } from '../../types'
import { type Props } from './types'

const CheckMark: FC = () => (
  <svg
    fill="none"
    height="12"
    stroke="currentColor"
    strokeLinecap="round"
    strokeWidth="3"
    viewBox="0 0 24 24"
    width="12"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const toPhoto = (result: UnsplashSearchResult): PresentationPhoto => ({
  id: `un_${result.id}`,
  source: 'unsplash',
  thumbUrl: result.thumbUrl,
  fullUrl: result.fullUrl,
  credit: result.credit || null,
})

// Ports openUnsplashPickerForPresExt / runUnsplashSearch / toggleUnsplashSelection
// / confirmUnsplashSelections (osago-bundle.js:18749-18861). "Powered by
// Unsplash" attribution is required (:18765).
export const UnsplashPickerModal: FC<Props> = ({ onClose, onConfirm }) => {
  const [inputValue, setInputValue] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [selected, setSelected] = useState<Record<string, PresentationPhoto>>(
    {},
  )

  const { errorMessage, isFetching, results } = useUnsplashSearch({
    query: submittedQuery,
  })

  const runSearch = (): void => setSubmittedQuery(inputValue.trim())

  const toggle = (result: UnsplashSearchResult): void => {
    setSelected(previous => {
      const next = { ...previous }
      if (next[result.id]) {
        delete next[result.id]
      } else {
        next[result.id] = toPhoto(result)
      }
      return next
    })
  }

  const selectedCount = Object.keys(selected).length

  const renderGrid = (): React.ReactNode => {
    if (submittedQuery.length === 0) {
      return null
    }
    if (isFetching) {
      return (
        <div
          style={{
            color: 'var(--muted)',
            fontSize: 13,
            padding: 32,
            textAlign: 'center',
          }}
        >
          Zoeken…
        </div>
      )
    }
    if (errorMessage) {
      return (
        <div
          style={{
            color: '#B91C1C',
            fontSize: 13,
            padding: 32,
            textAlign: 'center',
          }}
        >
          {errorMessage}
        </div>
      )
    }
    if (results.length === 0) {
      return (
        <div
          style={{
            color: 'var(--muted)',
            fontSize: 13,
            padding: 32,
            textAlign: 'center',
          }}
        >
          Geen resultaten voor &quot;{submittedQuery}&quot;.
        </div>
      )
    }
    return (
      <div
        style={{
          display: 'grid',
          gap: 8,
          gridTemplateColumns: 'repeat(4, 1fr)',
        }}
      >
        {results.map(result => {
          const isSelected = Boolean(selected[result.id])
          return (
            <div
              key={result.id}
              onClick={() => toggle(result)}
              style={{
                aspectRatio: '1',
                borderRadius: 6,
                border: `2px solid ${isSelected ? 'var(--green-dark)' : 'transparent'}`,
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
                transition: 'border-color .1s',
              }}
            >
              <img
                alt=""
                src={result.thumbUrl}
                style={{
                  display: 'block',
                  height: '100%',
                  objectFit: 'cover',
                  pointerEvents: 'none',
                  width: '100%',
                }}
              />
              {isSelected && (
                <div
                  style={{
                    alignItems: 'center',
                    background: 'var(--green-dark)',
                    borderRadius: '50%',
                    color: '#fff',
                    display: 'flex',
                    height: 22,
                    justifyContent: 'center',
                    position: 'absolute',
                    right: 4,
                    top: 4,
                    width: 22,
                  }}
                >
                  <CheckMark />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" onClick={event => event.stopPropagation()}>
        <div className="modal-header">
          <h3>Zoek standaard afbeeldingen op internet</h3>
          <button
            aria-label="Sluiten"
            className="modal-close"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input
              onChange={event => setInputValue(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  runSearch()
                }
              }}
              placeholder="Zoek bijv. 'kantoor', 'bakkerij', 'werkplaats'."
              style={{
                border: '1px solid var(--line)',
                borderRadius: 6,
                flex: 1,
                fontSize: 13.5,
                padding: '10px 12px',
              }}
              type="text"
              value={inputValue}
            />
            <button
              className="btn btn-secondary"
              onClick={runSearch}
              type="button"
            >
              Zoeken
            </button>
          </div>
          <div style={{ minHeight: 80 }}>{renderGrid()}</div>
          <div
            style={{
              color: 'var(--muted)',
              fontSize: 11,
              marginTop: 10,
              textAlign: 'right',
            }}
          >
            Powered by{' '}
            <a
              href="https://unsplash.com"
              rel="noopener"
              style={{ color: 'var(--muted)', textDecoration: 'underline' }}
              target="_blank"
            >
              Unsplash.com
            </a>
          </div>
        </div>
        <div className="modal-footer">
          <div style={{ color: 'var(--muted)', flex: 1, fontSize: 13 }}>
            {`${selectedCount} `} foto(&apos;s) geselecteerd
          </div>
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Annuleren
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onConfirm(Object.values(selected))}
            type="button"
          >
            Klaar
          </button>
        </div>
      </div>
    </div>
  )
}
