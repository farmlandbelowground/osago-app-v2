'use client'

import {
  useEffect,
  useRef,
  useState,
  type FC,
  type KeyboardEvent,
} from 'react'

import { useDebouncedValue } from '@shared/hooks/useDebouncedValue'
import { cn } from '@shared/utils/cn'

import { SearchIcon } from '../../assets/icons'
import {
  KVK_SEARCH_DEBOUNCE_MS,
  KVK_SEARCH_MIN_QUERY_LENGTH,
} from '../../constants'
import { useKvkSearch } from '../../hooks/useKvkSearch'
import { type KvkSearchResult } from '../../schema'
import { KvkSearchResultsList } from '../KvkSearchResultsList'
import { type Props } from './types'

export const KvkSearchInput: FC<Props> = ({ onSelect }) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebouncedValue(query, KVK_SEARCH_DEBOUNCE_MS)
  const { isFetching, results } = useKvkSearch({ query: debouncedQuery })

  const showResults =
    isOpen && debouncedQuery.trim().length >= KVK_SEARCH_MIN_QUERY_LENGTH

  useEffect(() => {
    const onDocumentMouseDown = (event: MouseEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', onDocumentMouseDown)

    return () => {
      document.removeEventListener('mousedown', onDocumentMouseDown)
    }
  }, [])

  const onResultSelect = (result: KvkSearchResult): void => {
    setQuery('')
    setIsOpen(false)
    onSelect(result)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (results.length === 0) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex(previous => Math.min(previous + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(previous => Math.max(previous - 1, 0))
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      onResultSelect(results[activeIndex])
    } else if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <SearchIcon className={`
        pointer-events-none absolute top-1/2 left-3 h-[18px] w-[18px]
        -translate-y-1/2 text-muted-foreground
      `} />
      <input
        className={`
          w-full rounded-md border border-border bg-surface px-10 py-3 text-sm
          transition-[border-color,box-shadow] duration-150
          focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,179,60,0.1)]
          focus:outline-none
        `}
        onChange={event => {
          setQuery(event.target.value)
          setActiveIndex(-1)
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Voer bedrijfsnaam, KVK-nummer of plaats in (bijv. '68750110')"
        type="text"
        value={query}
      />
      {isFetching && (
        <span
          className={cn(
            `
              absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 animate-spin
              rounded-full border-2 border-border
            `,
            'border-t-primary',
          )}
        />
      )}

      {showResults && !isFetching && (
        <KvkSearchResultsList
          activeIndex={activeIndex}
          onSelect={onResultSelect}
          query={debouncedQuery}
          results={results}
        />
      )}
    </div>
  )
}
