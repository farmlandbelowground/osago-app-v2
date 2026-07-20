import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import { type Props } from './types'

export const KvkSearchResultsList: FC<Props> = ({
  activeIndex,
  onSelect,
  query,
  results,
}) => {
  if (results.length === 0) {
    return (
      <div className="kvk-results active">
        <div className="kvk-no-results">
          Geen resultaten gevonden voor &quot;{query}&quot;
        </div>
      </div>
    )
  }

  return (
    <div className="kvk-results active">
      {results.map((result, index) => (
        <button
          className={cn('kvk-result', index === activeIndex && 'focused')}
          key={`${result.kvkNummer}-${result.vestigingsnummer ?? ''}`}
          onClick={() => onSelect(result)}
          style={{ display: 'block', width: '100%', textAlign: 'left' }}
          type="button"
        >
          <div className="kvk-result-name">{result.naam}</div>
          <div className="kvk-result-meta">
            {result.type === 'hoofdvestiging' && (
              <span className="kvk-tag hoofd">hoofdvestiging</span>
            )}
            <span>KVK {result.kvkNummer}</span>
            {result.adres?.binnenlandsAdres?.plaats && (
              <span>{result.adres.binnenlandsAdres.plaats}</span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
