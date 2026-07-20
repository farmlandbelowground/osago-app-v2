'use client'

import Script from 'next/script'
import { useEffect, useRef, useState, type FC } from 'react'

import { env } from '@/env'

import { type Props, type TurnstileGlobal } from './types'

declare global {
  interface Window {
    turnstile?: TurnstileGlobal
  }
}

export const TurnstileWidget: FC<Props> = ({ name, resetSignal }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const hiddenInputRef = useRef<HTMLInputElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [isScriptReady, setIsScriptReady] = useState(false)

  useEffect(() => {
    if (!isScriptReady || !containerRef.current || !window.turnstile) {
      return
    }

    const turnstile = window.turnstile
    const setHiddenValue = (value: string): void => {
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = value
      }
    }

    const widgetId = turnstile.render(containerRef.current, {
      callback: setHiddenValue,
      'error-callback': () => setHiddenValue(''),
      'expired-callback': () => setHiddenValue(''),
      sitekey: env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      theme: 'light',
      size:  'normal'
    })
    widgetIdRef.current = widgetId

    return () => {
      turnstile.remove(widgetId)
      widgetIdRef.current = null
    }
  }, [isScriptReady])

  useEffect(() => {
    if (resetSignal === undefined) {
      return
    }

    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
    }

    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = ''
    }
  }, [resetSignal])

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onReady={() => setIsScriptReady(true)}
      />
      <div className="recaptcha-wrap" ref={containerRef} />
      <input ref={hiddenInputRef} type="hidden" name={name} defaultValue="" />
    </>
  )
}
