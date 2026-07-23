// App-wide image-upload whitelist (spec §13.2, ports legacy ALLOWED_IMAGE_*).
// Deliberately limited: other formats (webp/heic/gif) produced corrupt output
// and would break the pdf-lib injection. SVG is allowed but rasterised to JPEG
// before it is placed in a generated document (see resolvePhotoBytes).
export const ALLOWED_IMAGE_MIME = [
  'image/png',
  'image/jpeg',
  'image/svg+xml',
] as const

export const ALLOWED_IMAGE_ACCEPT = ALLOWED_IMAGE_MIME.join(',')

export const ALLOWED_IMAGE_LABEL = 'JPG/JPEG, PNG of SVG'
