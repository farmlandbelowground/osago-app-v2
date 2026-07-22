'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { type ChangeEvent, type FC, useRef } from 'react'
import { useForm } from 'react-hook-form'

import { useToastStore } from '@shared/store/toast'

import { adminDeleteType, adminSaveType } from '../../actions'
import {
  ADVANCE_MAX,
  ADVANCE_MIN,
  ADVANCE_STEP,
  AFSPRAAK_PATH,
  BUFFER_MAX,
  BUFFER_MIN,
  BUFFER_STEP,
  DEFAULT_ADVANCE_NOTICE_MIN,
  DEFAULT_APPOINTMENT_COLOR,
  DEFAULT_DURATION_MIN,
  DEFAULT_LOCATION_KIND,
  DEFAULT_NEW_BUFFER_MIN,
  DEFAULT_NEW_LOCATION_DETAILS,
  DEFAULT_ROLLING_DAYS,
  DURATION_MAX,
  DURATION_MIN,
  DURATION_STEP,
  ROLLING_MAX,
  ROLLING_MIN,
  ROLLING_STEP,
} from '../../constants'
import { slugifyAppointmentName } from '../../lib/slug'
import { AdminTypeFormSchema, type AdminTypeFormInput } from '../../schema'
import { type LocationKind } from '../../types'
import { type Props } from './types'

export const AdminAppointmentTypeModal: FC<Props> = ({
  admins,
  bookingCount,
  onClose,
  type,
}) => {
  const showToast = useToastStore(state => state.showToast)

  const form = useForm<AdminTypeFormInput>({
    defaultValues: {
      active: type?.active ?? true,
      advanceNoticeMin: type?.advanceNoticeMin ?? DEFAULT_ADVANCE_NOTICE_MIN,
      assignedAdminIds: type?.assignedAdminIds ?? [],
      bufferAfter: type?.bufferAfter ?? DEFAULT_NEW_BUFFER_MIN,
      color: type?.color ?? DEFAULT_APPOINTMENT_COLOR,
      description: type?.description ?? '',
      duration: type?.duration ?? DEFAULT_DURATION_MIN,
      id: type?.id,
      location: (type?.location ?? DEFAULT_LOCATION_KIND) as LocationKind,
      locationDetails: type
        ? type.locationDetails
        : DEFAULT_NEW_LOCATION_DETAILS,
      name: type?.name ?? '',
      rollingDays: type?.rollingDays ?? DEFAULT_ROLLING_DAYS,
      slug: type?.slug ?? '',
    },
    resolver: zodResolver(AdminTypeFormSchema),
  })

  // Auto-fill the slug from the name as the admin types, while the slug is still
  // empty or was itself auto-filled — ports legacy updateAppointmentSlugPreview
  // (osago-bundle.js:27006). Editing an existing type keeps its saved slug.
  const autoFilledRef = useRef(false)

  const onNameChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (!form.getValues('slug') || autoFilledRef.current) {
      form.setValue('slug', slugifyAppointmentName(event.target.value))
      autoFilledRef.current = true
    }
  }

  const nameValue = form.watch('name')
  const slugValue = form.watch('slug')
  const previewSlug = slugifyAppointmentName(slugValue || nameValue)
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  const bookingUrl = previewSlug
    ? `${origin}${AFSPRAAK_PATH}/${previewSlug}`
    : ''

  const onSubmit = async (data: AdminTypeFormInput): Promise<void> => {
    const result = await adminSaveType(data)
    if (result.error) {
      form.setError('root', { message: result.error })
      return
    }

    showToast(type ? 'Afspraaktype bijgewerkt.' : 'Afspraaktype aangemaakt.')
    onClose()
  }

  const onDelete = async (): Promise<void> => {
    if (!type) {
      return
    }

    const confirmMessage =
      bookingCount > 0
        ? `Dit afspraaktype heeft al ${bookingCount} boeking${bookingCount === 1 ? '' : 'en'}. Verwijderen verbreekt de koppeling. Weet je het zeker?`
        : 'Weet je zeker dat je dit afspraaktype wilt verwijderen?'
    if (!window.confirm(confirmMessage)) {
      return
    }

    const result = await adminDeleteType(type.id)
    if (result.error) {
      showToast(result.error, 'error')
      return
    }

    showToast('Afspraaktype verwijderd.')
    onClose()
  }

  const onCopy = (): void => {
    void navigator.clipboard.writeText(bookingUrl)
    showToast('Boekingslink gekopieerd.')
  }

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div
        className="modal modal-lg"
        onClick={event => event.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{type ? `Afspraaktype — ${type.name}` : 'Nieuw afspraaktype'}</h3>
          <button className="modal-close" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <form onSubmit={event => void form.handleSubmit(onSubmit)(event)}>
          <div className="modal-body">
            <div className="form-row" style={{ marginBottom: 14 }}>
              <div className="field">
                <label>Naam *</label>
                <input
                  placeholder="Bv. Kennismakingsgesprek"
                  type="text"
                  {...form.register('name', { onChange: onNameChange })}
                />
                {form.formState.errors.name && (
                  <p className="text-xs" style={{ color: 'var(--danger)' }}>
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="field">
                <label>Slug (URL-segment)</label>
                <input
                  placeholder="auto op basis van naam"
                  type="text"
                  {...form.register('slug')}
                />
                <span
                  className="text-xs text-muted"
                  style={{ display: 'block', marginTop: 4 }}
                >
                  Alleen kleine letters, cijfers en streepjes — wordt onderdeel
                  van de boekingslink.
                </span>
              </div>
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label>Omschrijving</label>
              <textarea
                placeholder="Korte beschrijving die de klant ziet op de boekingspagina"
                rows={2}
                style={{
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                  resize: 'vertical',
                }}
                {...form.register('description')}
              />
            </div>

            <div className="form-row" style={{ marginBottom: 14 }}>
              <div className="field">
                <label>Duur (min) *</label>
                <input
                  max={DURATION_MAX}
                  min={DURATION_MIN}
                  step={DURATION_STEP}
                  type="number"
                  {...form.register('duration', { valueAsNumber: true })}
                />
              </div>
              <div className="field">
                <label>Buffer na afloop (min)</label>
                <input
                  max={BUFFER_MAX}
                  min={BUFFER_MIN}
                  step={BUFFER_STEP}
                  type="number"
                  {...form.register('bufferAfter', { valueAsNumber: true })}
                />
              </div>
              <div className="field">
                <label>Kleur</label>
                <input
                  style={{ cursor: 'pointer', height: 38, padding: 2 }}
                  type="color"
                  {...form.register('color')}
                />
              </div>
            </div>

            <div className="form-row" style={{ marginBottom: 14 }}>
              <div className="field">
                <label>Locatie *</label>
                <select {...form.register('location')}>
                  <option value="video">Online (video)</option>
                  <option value="phone">Telefonisch</option>
                  <option value="office">Op kantoor</option>
                </select>
              </div>
              <div className="field">
                <label>Locatie-details</label>
                <input
                  placeholder="bv. Microsoft Teams of adres"
                  type="text"
                  {...form.register('locationDetails')}
                />
              </div>
            </div>

            <div className="form-row" style={{ marginBottom: 14 }}>
              <div className="field">
                <label>Minimale aankondiging (min)</label>
                <input
                  max={ADVANCE_MAX}
                  min={ADVANCE_MIN}
                  step={ADVANCE_STEP}
                  type="number"
                  {...form.register('advanceNoticeMin', {
                    valueAsNumber: true,
                  })}
                />
                <span
                  className="text-xs text-muted"
                  style={{ display: 'block', marginTop: 4 }}
                >
                  Hoe ver vooruit moet er minstens geboekt worden (bv. 60 = 1
                  uur).
                </span>
              </div>
              <div className="field">
                <label>Boekingsvenster (dagen vooruit)</label>
                <input
                  max={ROLLING_MAX}
                  min={ROLLING_MIN}
                  step={ROLLING_STEP}
                  type="number"
                  {...form.register('rollingDays', { valueAsNumber: true })}
                />
                <span
                  className="text-xs text-muted"
                  style={{ display: 'block', marginTop: 4 }}
                >
                  Tot hoeveel dagen vooruit kunnen klanten boeken.
                </span>
              </div>
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label>Gekoppelde medewerker(s) *</label>
              <div
                style={{
                  background: '#fff',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  maxHeight: 160,
                  overflowY: 'auto',
                  padding: '8px 12px',
                }}
              >
                {admins.length === 0 ? (
                  <div className="text-muted text-sm">
                    Geen medewerkers beschikbaar.
                  </div>
                ) : (
                  admins.map(admin => (
                    <label
                      key={admin.id}
                      style={{
                        alignItems: 'center',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: 8,
                        padding: '6px 0',
                      }}
                    >
                      <input
                        style={{
                          accentColor: 'var(--green)',
                          cursor: 'pointer',
                          height: 14,
                          width: 14,
                        }}
                        type="checkbox"
                        value={admin.id}
                        {...form.register('assignedAdminIds')}
                      />
                      <span>{admin.name}</span>
                      <span className="text-xs text-muted">{admin.email}</span>
                    </label>
                  ))
                )}
              </div>
              <span
                className="text-xs text-muted"
                style={{ display: 'block', marginTop: 4 }}
              >
                Een klant kan dit type alleen boeken als minstens één gekoppelde
                medewerker beschikbaar is.
              </span>
              {form.formState.errors.assignedAdminIds && (
                <p className="text-xs" style={{ color: 'var(--danger)' }}>
                  {form.formState.errors.assignedAdminIds.message}
                </p>
              )}
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label className="toggle-switch" style={{ padding: '6px 0' }}>
                <input type="checkbox" {...form.register('active')} />
                <span className="toggle-track" />
                <span className="toggle-label">
                  Actief — boekingslink werkt en type is beschikbaar voor
                  klanten
                </span>
              </label>
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Boekingslink (preview)</label>
              <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
                <input
                  readOnly
                  style={{
                    background: 'var(--line-soft)',
                    flex: 1,
                    fontFamily: 'monospace',
                    fontSize: 12.5,
                  }}
                  type="text"
                  value={bookingUrl}
                />
                {type ? (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={onCopy}
                    type="button"
                  >
                    Kopieer
                  </button>
                ) : (
                  <span className="text-xs text-muted">
                    Wordt actief na opslaan
                  </span>
                )}
              </div>
            </div>

            {form.formState.errors.root && (
              <p
                className="text-sm"
                style={{ color: 'var(--danger)', marginTop: 14 }}
              >
                {form.formState.errors.root.message}
              </p>
            )}
          </div>

          <div className="modal-footer">
            {type && (
              <button
                className="btn btn-danger"
                onClick={() => void onDelete()}
                type="button"
              >
                Verwijderen
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button
              className="btn btn-secondary"
              onClick={onClose}
              type="button"
            >
              Annuleren
            </button>
            <button
              className="btn btn-primary"
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting
                ? 'Bezig…'
                : type
                  ? 'Wijzigingen opslaan'
                  : 'Afspraaktype aanmaken'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
