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
      <div className={`
        absolute inset-x-0 top-full z-10 mt-1 rounded-md border border-border
        bg-surface p-3 text-[13px] text-muted-foreground shadow-md
      `}>
        Geen resultaten gevonden voor &quot;{query}&quot;
      </div>
    )
  }

  return (
    <div className={`
      absolute inset-x-0 top-full z-10 mt-1 max-h-72 overflow-y-auto rounded-md
      border border-border bg-surface shadow-md
    `}>
      {results.map((result, index) => (
        <button
          className={cn(
            `
              flex w-full flex-col gap-0.5 border-b border-border-soft px-3.5
              py-3 text-left
              last:border-b-0
              hover:bg-primary-soft
            `,
            index === activeIndex && 'bg-primary-soft',
          )}
          key={`${result.kvkNummer}-${result.vestigingsnummer ?? ''}`}
          onClick={() => onSelect(result)}
          type="button"
        >
          <span className="text-sm font-semibold text-foreground">
            {result.naam}
          </span>
          <span className={`
            flex flex-wrap items-center gap-2 text-xs text-muted-foreground
          `}>
            {result.type === 'hoofdvestiging' && (
              <span className={`
                rounded-full bg-primary-soft px-1.5 py-px text-[10.5px]
                font-semibold text-primary-hover
              `}>
                hoofdvestiging
              </span>
            )}
            <span>KVK {result.kvkNummer}</span>
            {result.adres?.binnenlandsAdres?.plaats && (
              <span>{result.adres.binnenlandsAdres.plaats}</span>
            )}
          </span>
        </button>
      ))}
    </div>
  )
}
