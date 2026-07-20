'use client'

import { useRef, useState, type ChangeEvent, type FC } from 'react'
import { read, utils } from 'xlsx'

import { extractFinancials } from '@features/valuation/actions'
import { type FinancialsExtraction } from '@features/valuation/types'
import { type ApiResult } from '@shared/api/fetcher'

import {
  ACCEPTED_FILE_EXTENSIONS,
  MAX_PDF_SIZE_BYTES,
  SHEET_HEADER_PREFIX,
} from './constants'
import { type Props } from './types'

const getFileExtension = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf('.')
  return lastDot === -1 ? '' : fileName.slice(lastDot).toLowerCase()
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })

const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })

const extractFromSpreadsheet = async (
  file: File,
): Promise<ApiResult<FinancialsExtraction>> => {
  const buffer = await readFileAsArrayBuffer(file)
  const workbook = read(buffer, { type: 'array' })
  const text = workbook.SheetNames.map(
    sheetName =>
      `${SHEET_HEADER_PREFIX}${sheetName}\n${utils.sheet_to_csv(workbook.Sheets[sheetName])}`,
  ).join('\n\n')

  return extractFinancials({ kind: 'text', text })
}

export const FinancialsExtractionUpload: FC<Props> = ({ onExtracted }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const onFileSelected = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const extension = getFileExtension(file.name)
      let result: ApiResult<FinancialsExtraction>

      if (extension === '.pdf') {
        if (file.size > MAX_PDF_SIZE_BYTES) {
          setError('Het PDF-bestand is groter dan 10MB.')
          setIsLoading(false)
          return
        }

        const dataUrl = await readFileAsDataUrl(file)
        const dataBase64 = dataUrl.split(',')[1] ?? ''
        result = await extractFinancials({ dataBase64, kind: 'pdf' })
      } else if (extension === '.xlsx' || extension === '.xls') {
        result = await extractFromSpreadsheet(file)
      } else if (extension === '.csv') {
        const text = await readFileAsText(file)
        result = await extractFinancials({ kind: 'text', text })
      } else {
        setError('Bestandstype wordt niet ondersteund.')
        setIsLoading(false)
        return
      }

      if (result.error !== null) {
        setError(result.error)
        return
      }

      onExtracted(result.data)
    } catch {
      setError('Het bestand kon niet worden verwerkt.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="form-section" style={{ marginBottom: 0 }}>
        <h3 className="form-section-title">Gegevens uploaden</h3>
        <p className="form-section-desc">
          Upload je jaarstukken (PDF of Excel) en we proberen automatisch zoveel
          mogelijk velden uit de tabel <em>Financiële gegevens</em> in te
          vullen.
        </p>

        <div
          style={{
            background: 'var(--line-soft)',
            border: '2px dashed var(--line)',
            borderRadius: 'var(--radius)',
            marginTop: '14px',
            padding: '22px 18px',
            textAlign: 'center',
          }}
        >
          <svg
            fill="none"
            height="32"
            stroke="currentColor"
            strokeWidth="1.7"
            style={{ color: 'var(--muted)', marginBottom: '8px' }}
            viewBox="0 0 24 24"
            width="32"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
          </svg>
          <div
            style={{
              color: 'var(--ink)',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '4px',
            }}
          >
            Sleep jouw jaarstukken hierheen of klik om te bladeren
          </div>
          <div className="text-xs text-muted" style={{ marginBottom: '14px' }}>
            Ondersteunde formaten: PDF, XLSX, XLS, CSV. Maximaal 10 MB per
            bestand.
          </div>
          <input
            accept={ACCEPTED_FILE_EXTENSIONS}
            disabled={isLoading}
            onChange={event => void onFileSelected(event)}
            ref={inputRef}
            style={{ display: 'none' }}
            type="file"
          />
          <button
            className="btn btn-secondary btn-sm"
            disabled={isLoading}
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            {isLoading ? 'Bezig met verwerken...' : 'Bestand kiezen'}
          </button>
        </div>

        {error && <div className="alert alert-error mt-3">{error}</div>}
      </div>
    </div>
  )
}
