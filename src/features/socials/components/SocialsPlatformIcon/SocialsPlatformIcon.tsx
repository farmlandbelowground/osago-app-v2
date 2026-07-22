import { type FC } from 'react'

import { type Props } from './types'

// Ports socialsPlatformIcon (osago-bundle.js:28352).
export const SocialsPlatformIcon: FC<Props> = ({ platform }) => {
  if (platform === 'instagram') {
    return (
      <svg
        fill="none"
        height="14"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="14"
      >
        <rect height="20" rx="5" ry="5" width="20" x="2" y="2" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    )
  }
  if (platform === 'linkedin') {
    return (
      <svg
        fill="none"
        height="14"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="14"
      >
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect height="12" width="4" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    )
  }
  return (
    <svg
      fill="none"
      height="14"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="14"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}
