import { BYTES_PER_UNIT, FILE_SIZE_DECIMALS } from '../constants/storage'

// Ports formatFileSize (osago-bundle.js:6751-6756).
export const formatFileSize = (bytes: number | null): string => {
  if (!bytes) {
    return '0 B'
  }
  if (bytes < BYTES_PER_UNIT) {
    return `${bytes} B`
  }
  if (bytes < BYTES_PER_UNIT * BYTES_PER_UNIT) {
    return `${(bytes / BYTES_PER_UNIT).toFixed(FILE_SIZE_DECIMALS)} KB`
  }
  return `${(bytes / (BYTES_PER_UNIT * BYTES_PER_UNIT)).toFixed(FILE_SIZE_DECIMALS)} MB`
}
