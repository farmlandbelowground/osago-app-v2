'use client'

import { useRef, useState, type CSSProperties, type FC } from 'react'

import { useToastStore } from '@shared/store/toast'

import { savePresentationPhotos } from '../../actions'
import {
  PHOTO_ID_RANDOM_RADIX,
  PHOTO_ID_RANDOM_SLICE_END,
  PRES_MAX_PHOTOS_PER_TAB,
  PRES_MAX_UPLOAD_BYTES,
} from '../../constants/presentation'
import { type PresentationPhoto } from '../../types'
import { UnsplashPickerModal } from '../UnsplashPickerModal'
import { type Props } from './types'

const MAX_UPLOAD_MB = 5

const readAsDataUrl = (file: File): Promise<string | null> =>
  new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })

const uploadButtonStyle = (enabled: boolean): CSSProperties => ({
  alignItems: 'center',
  background: '#fff',
  border: '1.5px dashed var(--line)',
  borderRadius: 8,
  color: 'var(--ink)',
  cursor: enabled ? 'pointer' : 'not-allowed',
  display: 'flex',
  fontSize: 13.5,
  fontWeight: 500,
  gap: 8,
  justifyContent: 'center',
  opacity: enabled ? 1 : 0.5,
  padding: '14px 12px',
})

// Ports renderPresExtPhotoSection + the upload/remove handlers
// (osago-bundle.js:18647-18747). Shared by the builder and /waarderingsrapport.
// Photos are held in local state for immediate feedback and persisted straight
// to companies.extra on every change (spec §3.5, §1.2 — no localStorage cache).
export const PhotoSection: FC<Props> = ({ initialPhotos, tabId }) => {
  const showToast = useToastStore(state => state.showToast)
  const [photos, setPhotos] = useState<PresentationPhoto[]>(initialPhotos)
  const [pickerOpen, setPickerOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canAddMore = photos.length < PRES_MAX_PHOTOS_PER_TAB

  const persist = async (next: PresentationPhoto[]): Promise<void> => {
    const previous = photos
    setPhotos(next)
    const result = await savePresentationPhotos(tabId, next)
    if (result.error !== null) {
      setPhotos(previous)
      showToast(result.error, 'error')
    }
  }

  const handleFiles = async (fileList: FileList | null): Promise<void> => {
    const files = fileList ? Array.from(fileList) : []
    const slotsLeft = PRES_MAX_PHOTOS_PER_TAB - photos.length
    if (slotsLeft <= 0) {
      showToast(`Maximum ${PRES_MAX_PHOTOS_PER_TAB} foto's per tab.`, 'error')
      return
    }

    const accepted = files.slice(0, slotsLeft).filter(file => {
      if (!file.type.startsWith('image/')) {
        showToast(`"${file.name}" is geen afbeelding.`, 'error')
        return false
      }
      if (file.size > PRES_MAX_UPLOAD_BYTES) {
        showToast(`"${file.name}" is groter dan ${MAX_UPLOAD_MB}MB.`, 'error')
        return false
      }
      return true
    })

    const dataUrls = await Promise.all(accepted.map(readAsDataUrl))
    const clean: PresentationPhoto[] = dataUrls
      .filter((dataUrl): dataUrl is string => dataUrl !== null)
      .map(dataUrl => ({
        id: `up_${Date.now()}_${Math.random()
          .toString(PHOTO_ID_RANDOM_RADIX)
          .slice(2, PHOTO_ID_RANDOM_SLICE_END)}`,
        source: 'upload',
        thumbUrl: dataUrl,
        fullUrl: dataUrl,
        credit: null,
      }))

    if (clean.length === 0) {
      return
    }

    await persist(photos.concat(clean))
    showToast(
      `${clean.length} foto${clean.length === 1 ? '' : "'s"} toegevoegd.`,
    )
  }

  const removePhoto = (id: string): void => {
    void persist(photos.filter(photo => photo.id !== id))
  }

  const confirmUnsplash = (chosen: PresentationPhoto[]): void => {
    setPickerOpen(false)
    if (chosen.length === 0) {
      return
    }
    const slotsLeft = PRES_MAX_PHOTOS_PER_TAB - photos.length
    if (slotsLeft <= 0) {
      showToast(`Maximum ${PRES_MAX_PHOTOS_PER_TAB} foto's per tab.`, 'error')
      return
    }
    const toAdd = chosen.slice(0, slotsLeft)
    void persist(photos.concat(toAdd))
    showToast(
      `${toAdd.length} foto${toAdd.length === 1 ? '' : "'s"} toegevoegd.`,
    )
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h3 className="form-section-title" style={{ marginBottom: 12 }}>
        Foto&apos;s
      </h3>

      {photos.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 12,
          }}
        >
          {photos.map(photo => (
            <div
              key={photo.id}
              style={{
                border: '1px solid var(--line)',
                borderRadius: 6,
                flexShrink: 0,
                height: 64,
                overflow: 'hidden',
                position: 'relative',
                width: 64,
              }}
            >
              <img
                alt=""
                src={photo.thumbUrl || photo.fullUrl}
                style={{
                  display: 'block',
                  height: '100%',
                  objectFit: 'cover',
                  width: '100%',
                }}
              />
              <button
                onClick={() => removePhoto(photo.id)}
                style={{
                  alignItems: 'center',
                  background: 'rgba(20,30,25,0.85)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  height: 20,
                  justifyContent: 'center',
                  padding: 0,
                  position: 'absolute',
                  right: 2,
                  top: 2,
                  width: 20,
                }}
                title="Foto verwijderen"
                type="button"
              >
                <svg
                  fill="none"
                  height="10"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                  width="10"
                >
                  <line x1="18" x2="6" y1="6" y2="18" />
                  <line x1="6" x2="18" y1="6" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
        <button
          disabled={!canAddMore}
          onClick={() => fileInputRef.current?.click()}
          style={uploadButtonStyle(canAddMore)}
          title={canAddMore ? undefined : "Maximum aantal foto's bereikt"}
          type="button"
        >
          <svg
            fill="none"
            height="16"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="16"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          Eigen foto&apos;s uploaden
        </button>
        <button
          disabled={!canAddMore}
          onClick={() => setPickerOpen(true)}
          style={uploadButtonStyle(canAddMore)}
          title={canAddMore ? undefined : "Maximum aantal foto's bereikt"}
          type="button"
        >
          <svg
            fill="none"
            height="16"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="16"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          Zoek standaard afbeeldingen op internet
        </button>
      </div>

      <div className="text-xs" style={{ color: 'var(--muted)', marginTop: 8 }}>
        Voeg minimaal één foto toe (verplicht) — een eigen upload of een
        stockfoto.
      </div>

      <input
        accept="image/*"
        multiple
        onChange={event => {
          void handleFiles(event.target.files)
          event.target.value = ''
        }}
        ref={fileInputRef}
        style={{ display: 'none' }}
        type="file"
      />

      {pickerOpen && (
        <UnsplashPickerModal
          onClose={() => setPickerOpen(false)}
          onConfirm={confirmUnsplash}
        />
      )}
    </div>
  )
}
