'use client'

import { type ChangeEvent, type FC } from 'react'

import { useToastStore } from '@shared/store/toast'

import { ALLOWED_LOGO_MIME_TYPES, LOGO_MAX_BYTES } from '../../constants'
import { type Props } from './types'

const isAllowedLogoMimeType = (mimeType: string): boolean =>
  (ALLOWED_LOGO_MIME_TYPES as readonly string[]).includes(mimeType)

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

// Base64 data-URL logo upload, mirroring features/company CompanyLogoUpload but
// writing into the parent form (not its own action) — the data URL is persisted
// as a field on the partner upsert. Ports legacy handlePartnerLogoUpload
// (osago-bundle.js:26527): 2 MB cap, PNG/JPG/SVG, stored in partners.logo.
export const PartnerLogoField: FC<Props> = ({ logo, onChange }) => {
  const showToast = useToastStore(state => state.showToast)

  const onFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    if (!isAllowedLogoMimeType(file.type)) {
      showToast('Selecteer een afbeelding (PNG, JPG of SVG).', 'error')
      return
    }

    if (file.size > LOGO_MAX_BYTES) {
      showToast('Logo is te groot — max 2 MB.', 'error')
      return
    }

    const dataUrl = await readAsDataUrl(file)
    onChange(dataUrl)
  }

  return (
    <div>
      {logo && (
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              alignItems: 'center',
              background: 'var(--line-soft)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              display: 'flex',
              height: 64,
              justifyContent: 'center',
              overflow: 'hidden',
              width: 64,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URL, next/image cannot optimize */}
            <img
              alt="Partnerlogo"
              src={logo}
              style={{ display: 'block', maxHeight: '100%', maxWidth: '100%' }}
            />
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onChange('')}
            type="button"
          >
            Logo verwijderen
          </button>
        </div>
      )}
      <input
        accept={ALLOWED_LOGO_MIME_TYPES.join(',')}
        onChange={event => void onFileChange(event)}
        type="file"
      />
      <span
        className="text-xs text-muted"
        style={{ display: 'block', marginTop: 4 }}
      >
        PNG, JPG of SVG. Verschijnt op de partner-registratiepagina naast het
        Osago-logo.
      </span>
    </div>
  )
}
