import { ALLOWED_IMAGE_MIME } from './constants'

// True if the file is an allowed image format. Falls back to the extension when
// the browser gives no MIME. Ports isAllowedImageFile (osago-bundle.js #65).
export const isAllowedImageFile = (file: File): boolean => {
  const type = (file.type || '').toLowerCase()
  if (type) {
    return (ALLOWED_IMAGE_MIME as readonly string[]).includes(
      type === 'image/jpg' ? 'image/jpeg' : type,
    )
  }
  return /\.(png|jpe?g|svg)$/i.test(file.name || '')
}
