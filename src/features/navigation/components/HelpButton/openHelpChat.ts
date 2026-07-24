import { TAWK_EMBED_SRC } from './constants'

interface TawkApi {
  maximize?: () => void
  onLoad?: () => void
}

declare global {
  interface Window {
    Tawk_API?: TawkApi
    Tawk_LoadStart?: Date
  }
}

let isLoading = false

// Lazy-loads the Tawk.to chat widget and opens it. Ported from the legacy
// openHelpChat() (osago-bundle.js): the script is injected only on the first
// click; Tawk itself renders the bottom-right bubble and, via onLoad, we
// maximize the window. Later clicks skip re-injection and just maximize again.
export const openHelpChat = (): void => {
  const tawk = window.Tawk_API
  if (typeof tawk?.maximize === 'function') {
    try {
      tawk.maximize()
    } catch {
      // maximize can throw if the widget iframe isn't fully ready yet.
    }
    return
  }

  if (isLoading) return
  isLoading = true

  const api: TawkApi = window.Tawk_API ?? {}
  api.onLoad = () => {
    try {
      window.Tawk_API?.maximize?.()
    } catch {
      // maximize can throw if the widget iframe isn't fully ready yet.
    }
  }
  window.Tawk_API = api
  window.Tawk_LoadStart = new Date()

  const script = document.createElement('script')
  script.async = true
  script.src = TAWK_EMBED_SRC
  script.setAttribute('charset', 'UTF-8')
  script.setAttribute('crossorigin', '*')

  const firstScript = document.getElementsByTagName('script')[0]
  firstScript?.parentNode?.insertBefore(script, firstScript)
}
