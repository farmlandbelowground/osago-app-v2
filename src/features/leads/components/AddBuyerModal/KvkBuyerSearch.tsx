'use client'

import { useState, type FC } from 'react'

import { fetchKvkBasisprofiel } from '@features/company/actions'
import {
  KVK_SEARCH_DEBOUNCE_MS,
  KVK_SEARCH_MIN_QUERY_LENGTH,
} from '@features/company/constants'
import { useKvkSearch } from '@features/company/hooks/useKvkSearch'
import { buildKvkPrefill } from '@features/company/lib/buildKvkPrefill'
import { type KvkSearchResult } from '@features/company/schema'
import { useDebouncedValue } from '@shared/hooks/useDebouncedValue'
import { useToastStore } from '@shared/store/toast'

import { type KvkBuyerSearchProps } from './types'

// Ports the add-buyer KvK block (osago-bundle.js:23078-23095) +
// selectKvkResultForBuyer's basisprofiel enrichment (:23225-23286), reusing
// Slice 2's useKvkSearch hook / buildKvkPrefill logic.
export const KvkBuyerSearch: FC<KvkBuyerSearchProps> = ({ onPrefill }) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const showToast = useToastStore(state => state.showToast)

  const debouncedQuery = useDebouncedValue(query, KVK_SEARCH_DEBOUNCE_MS)
  const { isFetching, results } = useKvkSearch({ query: debouncedQuery })

  const showResults =
    isOpen && debouncedQuery.trim().length >= KVK_SEARCH_MIN_QUERY_LENGTH

  const onSelect = async (result: KvkSearchResult): Promise<void> => {
    setIsOpen(false)
    setQuery('')
    const basisprofiel = await fetchKvkBasisprofiel(result.kvkNummer)
    const { prefill } = buildKvkPrefill(result, basisprofiel.data, {})
    onPrefill(prefill)
    showToast(`Gegevens opgehaald uit KVK Handelsregister voor ${result.naam}.`)
  }

  return (
    <div className="kvk-card" style={{ marginBottom: '18px' }}>
      <div className="kvk-head">
        <div className="kvk-title">
          <svg
            fill="none"
            height="22"
            stroke="var(--green)"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="22"
          >
            <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
          </svg>
          <h3>Zoek deze koper in het KVK Handelsregister</h3>
        </div>
        <span className="kvk-badge">KVK Handelsregister</span>
      </div>
      <div className="kvk-search-wrap">
        <svg
          className="kvk-search-icon"
          fill="none"
          height="18"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="18"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          autoComplete="off"
          className="kvk-search-input"
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onChange={event => {
            setQuery(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Voer bedrijfsnaam, KVK-nummer of plaats in"
          type="text"
          value={query}
        />
        {isFetching && <div className="kvk-search-spinner active" />}
        {showResults && (
          <div className="kvk-results active">
            {results.length === 0 && !isFetching ? (
              <div className="kvk-no-results">
                Geen resultaten gevonden voor &quot;{debouncedQuery}&quot;
              </div>
            ) : (
              results.map(result => (
                <div
                  className="kvk-result"
                  key={result.kvkNummer + (result.vestigingsnummer ?? '')}
                  onMouseDown={() => void onSelect(result)}
                >
                  <div className="kvk-result-name">{result.naam}</div>
                  <div className="kvk-result-meta">
                    <span
                      className={`
                        kvk-tag
                        ${result.type === 'hoofdvestiging' ? `hoofd` : ''}
                      `}
                    >
                      {result.type}
                    </span>
                    <span>KVK {result.kvkNummer}</span>
                    {result.adres?.binnenlandsAdres?.plaats && (
                      <span>{result.adres.binnenlandsAdres.plaats}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <div className="kvk-help">
        Vul je liever zelf in? Sla dit blok over en typ de gegevens hieronder.
      </div>
    </div>
  )
}
