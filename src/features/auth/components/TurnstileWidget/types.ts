export interface Props {
  name: string
  resetSignal?: unknown
}

export interface TurnstileRenderOptions {
  callback: (token: string) => void
  'error-callback': () => void
  'expired-callback': () => void
  sitekey: string
  size?: 'normal'
  theme?: 'light' | 'dark'
}

export interface TurnstileGlobal {
  remove: (widgetId: string) => void
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string
  reset: (widgetId: string) => void
}
