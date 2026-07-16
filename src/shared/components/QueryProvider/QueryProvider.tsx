'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type FC } from 'react'

import { type Props } from './types'

export const QueryProvider: FC<Props> = ({ children }) => {
  const [client] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}
