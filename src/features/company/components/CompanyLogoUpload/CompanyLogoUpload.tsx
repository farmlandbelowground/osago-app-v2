'use client'

import Image from 'next/image'
import { useState, type ChangeEvent, type FC } from 'react'

import { removeCompanyLogo, updateCompanyLogo } from '../../actions'
import { ImagePlaceholderIcon } from '../../assets/icons'
import {
  ALLOWED_LOGO_MIME_TYPES,
  LOGO_PREVIEW_HEIGHT_PX,
  LOGO_PREVIEW_WIDTH_PX,
} from '../../constants'
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

export const CompanyLogoUpload: FC<Props> = ({ logo }) => {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const onFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    if (!isAllowedLogoMimeType(file.type)) {
      setError('Selecteer een afbeelding (PNG, JPG, SVG of WebP).')
      return
    }

    setError(null)
    setIsPending(true)
    const dataUrl = await readAsDataUrl(file)
    const result = await updateCompanyLogo(dataUrl)
    setIsPending(false)

    if (result.error) {
      setError(result.error)
    }
  }

  const onRemove = async (): Promise<void> => {
    if (
      !window.confirm(
        'Weet je zeker dat je het bedrijfslogo wilt verwijderen?',
      )
    ) {
      return
    }

    setError(null)
    setIsPending(true)
    const result = await removeCompanyLogo()
    setIsPending(false)

    if (result.error) {
      setError(result.error)
    }
  }

  return (
    <div className="logo-upload-row">
      <div className="logo-upload-preview">
        {logo ? (
          <Image
            alt="Bedrijfslogo"
            height={LOGO_PREVIEW_HEIGHT_PX}
            src={logo}
            width={LOGO_PREVIEW_WIDTH_PX}
          />
        ) : (
          <div className="logo-upload-placeholder">
            <ImagePlaceholderIcon height={22} width={22} />
            <span>Geen logo</span>
          </div>
        )}
      </div>

      <div className="logo-upload-actions">
        <input
          accept={ALLOWED_LOGO_MIME_TYPES.join(',')}
          disabled={isPending}
          onChange={event => void onFileChange(event)}
          type="file"
        />
        <span className="text-xs text-muted">PNG, JPG, SVG of WebP.</span>
        {logo && (
          <button
            className="btn btn-ghost btn-sm"
            disabled={isPending}
            onClick={() => void onRemove()}
            style={{ alignSelf: 'flex-start', marginTop: '4px' }}
            type="button"
          >
            Logo verwijderen
          </button>
        )}
        {error && (
          <p style={{ color: 'var(--danger)', fontSize: '11.5px' }}>{error}</p>
        )}
      </div>
    </div>
  )
}
