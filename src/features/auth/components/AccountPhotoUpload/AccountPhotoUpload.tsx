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
      className="card mb-5"
      style={{ alignItems: 'center', display: 'flex', gap: 18 }}
    >
      <label
        className="account-avatar-wrap"
        htmlFor="account-photo-input"
        title="Klik om een profielfoto te uploaden"
      >
        <div
          className="user-avatar"
          style={{
            fontSize: ACCOUNT_AVATAR_INITIALS_FONT_SIZE_PX,
            height: ACCOUNT_PHOTO_PREVIEW_SIZE_PX,
            width: ACCOUNT_PHOTO_PREVIEW_SIZE_PX,
          }}
        >
          {photo ? (
            <Image
              alt="Profielfoto"
              height={ACCOUNT_PHOTO_PREVIEW_SIZE_PX}
              src={photo}
              width={ACCOUNT_PHOTO_PREVIEW_SIZE_PX}
            />
          ) : (
            buildInitials(firstName, lastName)
          )}
        </div>
        <div className="account-avatar-overlay">
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
        disabled={isPending}
        id="account-photo-input"
        onChange={event => void onFileChange(event)}
        style={{ display: 'none' }}
        type="file"
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em' }}>
          {firstName} {lastName}
        </div>
        <div className="text-sm text-muted">{email}</div>
        <div className="text-xs" style={{ marginTop: 6 }}>
          <button
            disabled={isPending}
            onClick={() =>
              document.getElementById('account-photo-input')?.click()
            }
            style={{ color: 'var(--green-dark)', textDecoration: 'underline' }}
            type="button"
          >
            {photo ? 'Foto wijzigen' : 'Profielfoto uploaden'}
          </button>
          {photo && (
            <>
              {' · '}
              <button
                disabled={isPending}
                onClick={() => void onRemove()}
                style={{ color: 'var(--danger)', textDecoration: 'underline' }}
                type="button"
              >
                Verwijderen
              </button>
            </>
          )}
        </div>
        {error && (
          <p className="text-xs" style={{ color: 'var(--danger)', marginTop: 4 }}>
            {error}
          </p>
        )}
      </div>
      {isAdmin && (
        <div className="text-sm" style={{ textAlign: 'right' }}>
          <div className="badge badge-purple">Beheerder</div>
          {createdAt && (
            <div className="text-xs text-muted mt-2">
              Lid sinds {formatMemberSince(createdAt)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
