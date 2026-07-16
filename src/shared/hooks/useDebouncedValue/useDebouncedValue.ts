import { useEffect, useState } from 'react'

import { type UseDebouncedValue } from './types'

export const useDebouncedValue: UseDebouncedValue = (value, delayMs) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delayMs])

  return debouncedValue
}
