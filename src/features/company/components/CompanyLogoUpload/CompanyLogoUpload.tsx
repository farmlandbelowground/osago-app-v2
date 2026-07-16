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
    <div className="flex flex-wrap items-start gap-[18px]">
      <div
        className={`
          flex shrink-0 items-center justify-center overflow-hidden rounded-sm
          border border-border bg-surface p-2
        `}
        style={{ height: LOGO_PREVIEW_HEIGHT_PX, width: LOGO_PREVIEW_WIDTH_PX }}
      >
        {logo ? (
          <Image
            alt="Bedrijfslogo"
            className="max-h-full max-w-full object-contain"
            height={LOGO_PREVIEW_HEIGHT_PX}
            src={logo}
            width={LOGO_PREVIEW_WIDTH_PX}
          />
        ) : (
          <div className={`
            flex flex-col items-center gap-1 text-muted-foreground
          `}>
            <ImagePlaceholderIcon className="h-[22px] w-[22px]" />
            <span className="text-[11px]">Geen logo</span>
          </div>
        )}
      </div>

      <div className="flex min-w-60 flex-1 flex-col gap-1.5">
        <input
          accept={ALLOWED_LOGO_MIME_TYPES.join(',')}
          className={`
            text-sm text-muted-foreground
            file:mr-3 file:cursor-pointer file:rounded-md file:border
            file:border-border file:bg-surface file:px-3.5 file:py-2
            file:text-sm file:font-semibold file:text-foreground
            file:transition-colors file:hover:bg-border-soft
          `}
          disabled={isPending}
          onChange={event => void onFileChange(event)}
          type="file"
        />
        <span className="text-xs text-muted-foreground">
          PNG, JPG, SVG of WebP.
        </span>
        {logo && (
          <button
            className={`
              self-start text-xs font-medium text-destructive
              hover:underline
            `}
            disabled={isPending}
            onClick={() => void onRemove()}
            type="button"
          >
            Logo verwijderen
          </button>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}
