'use client'

import { useEffect, useRef, useState, type FC } from 'react'

import { composeReportText } from '@features/valuation/actions'
import {
  AI_INSTRUCTION_PLACEHOLDER,
  AI_LENGTH_OPTIONS,
  AI_OVERWRITE_CONFIRM_THRESHOLD,
} from '@features/valuation/constants/aiCompose'
import {
  type AiComposeAction,
  type AiComposeLength,
} from '@features/valuation/types'
import { useToastStore } from '@shared/store/toast'

import { type Props } from './types'

const Chevron: FC = () => (
  <svg
    className="ai-chevron"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const Spinner: FC = () => (
  <svg
    fill="none"
    height="14"
    stroke="currentColor"
    strokeWidth="2"
    style={{
      animation: 'spin360 .8s linear infinite',
      marginRight: 6,
      verticalAlign: '-2px',
    }}
    viewBox="0 0 24 24"
    width="14"
  >
    <circle cx="12" cy="12" opacity="0.25" r="10" />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
)

export const AiPillGroup: FC<Props> = ({ currentValue, field, onResult }) => {
  const showToast = useToastStore(state => state.showToast)
  const [openMenu, setOpenMenu] = useState<AiComposeAction | null>(null)
  const [instruction, setInstruction] = useState('')
  const [loadingAction, setLoadingAction] = useState<AiComposeAction | null>(
    null,
  )
  const [pendingLength, setPendingLength] = useState<AiComposeLength | null>(
    null,
  )
  const instructionRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (openMenu === 'rewrite') {
      instructionRef.current?.focus()
    }
  }, [openMenu])

  const closeMenus = (): void => setOpenMenu(null)

  const toggleMenu = (action: AiComposeAction): void =>
    setOpenMenu(previous => (previous === action ? null : action))

  const execute = async (
    action: AiComposeAction,
    length: AiComposeLength,
    instructionText: string,
  ): Promise<void> => {
    setLoadingAction(action)
    try {
      const result = await composeReportText({
        action,
        field,
        length,
        instruction: instructionText || undefined,
        currentValue,
      })

      if (result.error !== null) {
        showToast(result.error, 'error')
        return
      }

      onResult(result.data.text)
      showToast(
        action === 'generate' ? 'Tekst gegenereerd.' : 'Tekst herschreven.',
      )
    } catch {
      showToast('AI-fout — probeer opnieuw.', 'error')
    } finally {
      setLoadingAction(null)
    }
  }

  const onOption = (action: AiComposeAction, length: AiComposeLength): void => {
    closeMenus()
    const instructionText = action === 'rewrite' ? instruction.trim() : ''

    if (
      action === 'generate' &&
      currentValue.trim().length > AI_OVERWRITE_CONFIRM_THRESHOLD
    ) {
      setPendingLength(length)
      return
    }

    void execute(action, length, instructionText)
  }

  const confirmOverwrite = (): void => {
    if (pendingLength === null) {
      return
    }
    const length = pendingLength
    setPendingLength(null)
    void execute('generate', length, '')
  }

  const isLoading = loadingAction !== null

  return (
    <>
      {openMenu !== null && (
        <div
          onClick={closeMenus}
          style={{ inset: 0, position: 'fixed', zIndex: 20 }}
        />
      )}

      <div
        className="ai-pill-group"
        style={openMenu !== null ? { zIndex: 31 } : undefined}
      >
        <button
          aria-expanded={openMenu === 'generate'}
          className="ai-pill"
          disabled={isLoading}
          onClick={() => toggleMenu('generate')}
          type="button"
        >
          {loadingAction === 'generate' ? (
            <>
              <Spinner />
              <span>Genereren…</span>
            </>
          ) : (
            <>
              Genereer
              <Chevron />
            </>
          )}
        </button>

        <button
          aria-expanded={openMenu === 'rewrite'}
          className="ai-pill"
          disabled={isLoading}
          onClick={() => toggleMenu('rewrite')}
          type="button"
        >
          {loadingAction === 'rewrite' ? (
            <>
              <Spinner />
              <span>Herschrijven…</span>
            </>
          ) : (
            <>
              Herschrijf
              <Chevron />
            </>
          )}
        </button>

        <div
          className={
            openMenu === 'generate' ? 'ai-pill-menu is-open' : 'ai-pill-menu'
          }
        >
          <div className="ai-pill-menu-section">
            <div className="ai-pill-menu-label">Lengte</div>
            <div className="ai-pill-menu-options">
              {AI_LENGTH_OPTIONS.map(option => (
                <button
                  className="ai-pill-menu-option"
                  key={option.length}
                  onClick={() => onOption('generate', option.length)}
                  type="button"
                >
                  <span className="ai-pill-menu-option-label">
                    {option.label}
                  </span>
                  <span className="ai-pill-menu-option-meta">
                    {option.meta}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className={
            openMenu === 'rewrite' ? 'ai-pill-menu is-open' : 'ai-pill-menu'
          }
        >
          <div className="ai-pill-menu-section">
            <div className="ai-pill-menu-label">Instructie (optioneel)</div>
            <input
              className="ai-pill-menu-input"
              onChange={event => setInstruction(event.target.value)}
              placeholder={AI_INSTRUCTION_PLACEHOLDER}
              ref={instructionRef}
              type="text"
              value={instruction}
            />
          </div>
          <div className="ai-pill-menu-section">
            <div className="ai-pill-menu-label">Lengte</div>
            <div className="ai-pill-menu-options">
              {AI_LENGTH_OPTIONS.map(option => (
                <button
                  className="ai-pill-menu-option"
                  key={option.length}
                  onClick={() => onOption('rewrite', option.length)}
                  type="button"
                >
                  <span className="ai-pill-menu-option-label">
                    {option.label}
                  </span>
                  <span className="ai-pill-menu-option-meta">
                    {option.meta}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {pendingLength !== null && (
        <div
          className="modal-overlay active"
          onClick={() => setPendingLength(null)}
        >
          <div className="modal" onClick={event => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Bestaande tekst overschrijven?</h3>
              <button
                aria-label="Sluiten"
                className="modal-close"
                onClick={() => setPendingLength(null)}
                type="button"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p
                style={{ color: 'var(--ink)', fontSize: 14, lineHeight: 1.55 }}
              >
                Er staat al tekst in dit veld. Als je nu genereert, wordt de
                huidige inhoud volledig vervangen.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setPendingLength(null)}
                type="button"
              >
                Annuleren
              </button>
              <button
                className="btn btn-primary"
                onClick={confirmOverwrite}
                type="button"
              >
                Vervangen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
