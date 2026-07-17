'use client'

import Image from 'next/image'
import { useState, type ChangeEvent, type FC } from 'react'

import { removeAccountPhoto, updateAccountPhoto } from '../../actions'
import {
  ACCOUNT_AVATAR_INITIALS_FONT_SIZE_PX,
  ACCOUNT_PHOTO_MAX_SIZE_BYTES,
  ACCOUNT_PHOTO_MAX_SIZE_MB,
  ACCOUNT_PHOTO_PREVIEW_SIZE_PX,
  ALLOWED_ACCOUNT_PHOTO_MIME_TYPES,
} from '../../constants'
import { formatMemberSince } from '../../lib/formatMemberSince'
import { type Props } from './types'

const buildInitials = (
  firstName: string | null,
  lastName: string | null,
): string => `${firstName?.[0] ?? '?'}${lastName?.[0] ?? '?'}`.toUpperCase()

const isAllowedPhotoMimeType = (mimeType: string): boolean =>
  (ALLOWED_ACCOUNT_PHOTO_MIME_TYPES as readonly string[]).includes(mimeType)

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

export const AccountPhotoUpload: FC<Props> = ({
  createdAt,
  email,
  firstName,
  lastName,
  photo,
  role,
}) => {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const isAdmin = role === 'admin' || role === 'admin_user'

  const onFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    if (!isAllowedPhotoMimeType(file.type)) {
      setError('Selecteer een afbeelding (PNG, JPG of WebP).')
      return
    }

    if (file.size > ACCOUNT_PHOTO_MAX_SIZE_BYTES) {
      setError(`Afbeelding is te groot (max ${ACCOUNT_PHOTO_MAX_SIZE_MB} MB).`)
      return
    }

    setError(null)
    setIsPending(true)
    const dataUrl = await readAsDataUrl(file)
    const result = await updateAccountPhoto(dataUrl)
    setIsPending(false)

    if (result.error) {
      setError(result.error)
    }
  }

  const onRemove = async (): Promise<void> => {
    if (
      !window.confirm('Weet je zeker dat je jouw profielfoto wilt verwijderen?')
    ) {
      return
    }

    setError(null)
    setIsPending(true)
    const result = await removeAccountPhoto()
    setIsPending(false)

    if (result.error) {
      setError(result.error)
    }
  }

  return (
    <div
      className={`
        mb-6 flex items-center gap-[18px] rounded-lg border border-border
        bg-surface p-6 shadow-sm
      `}
    >
      <label
        className={`
          group relative shrink-0 cursor-pointer rounded-full
          transition-transform
          hover:scale-[1.03]
        `}
        htmlFor="account-photo-input"
        title="Klik om een profielfoto te uploaden"
      >
        <div
          className={`
            flex items-center justify-center overflow-hidden rounded-full
            bg-gradient-to-br from-primary to-primary-hover font-semibold
            text-primary-foreground
          `}
          style={{
            fontSize: ACCOUNT_AVATAR_INITIALS_FONT_SIZE_PX,
            height: ACCOUNT_PHOTO_PREVIEW_SIZE_PX,
            width: ACCOUNT_PHOTO_PREVIEW_SIZE_PX,
          }}
        >
          {photo ? (
            <Image
              alt="Profielfoto"
              className="h-full w-full object-cover"
              height={ACCOUNT_PHOTO_PREVIEW_SIZE_PX}
              src={photo}
              width={ACCOUNT_PHOTO_PREVIEW_SIZE_PX}
            />
          ) : (
            buildInitials(firstName, lastName)
          )}
        </div>
        <div
          className={`
            absolute inset-0 flex items-center justify-center rounded-full
            bg-[rgba(10,31,20,0.55)] text-white opacity-0 transition-opacity
            group-hover:opacity-100
          `}
        >
          <svg
            fill="none"
            height="22"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="22"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
      </label>
      <input
        accept={ALLOWED_ACCOUNT_PHOTO_MIME_TYPES.join(',')}
        className="hidden"
        disabled={isPending}
        id="account-photo-input"
        onChange={event => void onFileChange(event)}
        type="file"
      />
      <div className="min-w-0 flex-1">
        <div
          className={`
            font-serif text-[22px] font-medium tracking-tight text-foreground
          `}
        >
          {firstName} {lastName}
        </div>
        <div className="text-sm text-muted-foreground">{email}</div>
        <div className="mt-1.5 text-xs">
          <button
            className="text-primary-hover underline"
            disabled={isPending}
            onClick={() =>
              document.getElementById('account-photo-input')?.click()
            }
            type="button"
          >
            {photo ? 'Foto wijzigen' : 'Profielfoto uploaden'}
          </button>
          {photo && (
            <>
              {' · '}
              <button
                className="text-destructive underline"
                disabled={isPending}
                onClick={() => void onRemove()}
                type="button"
              >
                Verwijderen
              </button>
            </>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
      {isAdmin && (
        <div className="text-right text-sm">
          <span
            className={`
              inline-flex items-center rounded-full bg-[#EDE9FE] px-2.5 py-[3px]
              text-[11px] font-semibold tracking-[0.03em] text-[#5B21B6]
              uppercase
            `}
          >
            Beheerder
          </span>
          {createdAt && (
            <div className="mt-2 text-xs text-muted-foreground">
              Lid sinds {formatMemberSince(createdAt)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
