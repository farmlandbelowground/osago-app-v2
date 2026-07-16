import { type Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import { type ReactNode } from 'react'

import { env } from '@/env'
import { ToastViewport } from '@shared/components/ToastViewport'

import './globals.css'

const inter = Inter({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
})

const fraunces = Fraunces({
  axes: ['opsz'],
  display: 'swap',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: 'variable',
})

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: { default: 'Osago', template: '%s | Osago' },
  description: 'Osago',
}

interface Props {
  children: ReactNode
}

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" className={`
      ${inter.variable}
      ${fraunces.variable}
    `}>
      <body>
        {children}
        <ToastViewport />
      </body>
    </html>
  )
}
