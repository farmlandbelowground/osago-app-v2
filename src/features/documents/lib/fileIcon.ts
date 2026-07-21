import {
  FILE_ICON_DEFAULT_COLOR,
  FILE_ICON_DOC_COLOR,
  FILE_ICON_IMG_COLOR,
  FILE_ICON_PDF_COLOR,
  FILE_ICON_PPT_COLOR,
  FILE_ICON_XLS_COLOR,
} from '../constants/fileIcons'
import { type FileIconMeta } from '../types'

// Ports fileIconMeta (osago-bundle.js:6758-6768).
export const fileIcon = (fileType: string, fileName: string): FileIconMeta => {
  const name = fileName.toLowerCase()
  const type = fileType.toLowerCase()

  if (type.includes('pdf') || name.endsWith('.pdf')) {
    return { color: FILE_ICON_PDF_COLOR, label: 'PDF' }
  }
  if (
    type.includes('word') ||
    name.endsWith('.doc') ||
    name.endsWith('.docx')
  ) {
    return { color: FILE_ICON_DOC_COLOR, label: 'DOC' }
  }
  if (
    type.includes('sheet') ||
    type.includes('excel') ||
    name.endsWith('.xls') ||
    name.endsWith('.xlsx') ||
    name.endsWith('.csv')
  ) {
    return { color: FILE_ICON_XLS_COLOR, label: 'XLS' }
  }
  if (
    type.includes('presentation') ||
    name.endsWith('.ppt') ||
    name.endsWith('.pptx')
  ) {
    return { color: FILE_ICON_PPT_COLOR, label: 'PPT' }
  }
  if (type.startsWith('image/')) {
    return { color: FILE_ICON_IMG_COLOR, label: 'IMG' }
  }
  if (type.startsWith('text/')) {
    return { color: FILE_ICON_DEFAULT_COLOR, label: 'TXT' }
  }
  return { color: FILE_ICON_DEFAULT_COLOR, label: 'FILE' }
}
