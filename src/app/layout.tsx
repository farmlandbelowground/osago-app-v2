import { type Metadata } from 'next'
import { type ReactNode } from 'react'

import { env } from '@/env'

import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: { default: 'OSAGO App', template: '%s | OSAGO App' },
  description: 'OSAGO App',
}

interface Props {
  children: ReactNode
}

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
