import sharp from 'sharp'

// Legacy downscaled photos to keep the output small (getPhotoBytesForGamma +
// downscaleImageToJpeg, osago-bundle.js). Server-side we use sharp: decode a
// data URL or fetch a remote URL, honor EXIF orientation, cap the longest side,
// flatten transparency onto white (JPEG has none) and transcode to JPEG so
// pdf-lib can always embed it.
const MAX_DIM = 1400
const JPEG_QUALITY = 82

export interface PhotoBytes {
  bytes: Uint8Array
  ext: 'jpeg' | 'png'
  height: number
  width: number
}

const decodeSource = async (
  src: string,
): Promise<{ bytes: Uint8Array; mime: string } | null> => {
  if (/^data:/i.test(src)) {
    const match = /^data:([^;,]+)[;,]/.exec(src)
    const mime = match?.[1] ?? 'image/png'
    const base64 = src.slice(src.indexOf(',') + 1)
    return { bytes: new Uint8Array(Buffer.from(base64, 'base64')), mime }
  }
  if (/^https?:\/\//i.test(src)) {
    try {
      const res = await fetch(src, { cache: 'no-store' })
      if (!res.ok) {
        return null
      }
      const mime = (res.headers.get('content-type') ?? 'image/jpeg').split(
        ';',
      )[0]
      return { bytes: new Uint8Array(await res.arrayBuffer()), mime }
    } catch {
      return null
    }
  }
  return null
}

// Resolve a photo source (data URL or remote https) to pdf-lib-safe JPEG bytes.
// Returns null when the source is unusable — a document without one photo is
// better than a broken document.
export const resolvePhotoBytes = async (
  src: string,
): Promise<PhotoBytes | null> => {
  const raw = await decodeSource(src)
  if (!raw) {
    return null
  }
  try {
    const { data, info } = await sharp(Buffer.from(raw.bytes))
      .rotate()
      .resize({
        fit: 'inside',
        height: MAX_DIM,
        width: MAX_DIM,
        withoutEnlargement: true,
      })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer({ resolveWithObject: true })
    return {
      bytes: new Uint8Array(data),
      ext: 'jpeg',
      height: info.height,
      width: info.width,
    }
  } catch (err) {
    console.warn('[Gamma] foto verwerken mislukt:', err)
    return null
  }
}
