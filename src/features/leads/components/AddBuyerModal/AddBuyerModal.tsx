'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type FC } from 'react'
import { useForm } from 'react-hook-form'

import { type KvkMergeableFields } from '@features/company/types'
import { useToastStore } from '@shared/store/toast'

import { addManualLead } from '../../actions'
import { COUNTRIES, DEFAULT_COUNTRY } from '../../constants/countries'
import { BUYER_TYPE_OPTIONS } from '../../constants/leadTypes'
import { ManualLeadFormSchema } from '../../schema'
import { type ManualLeadInput } from '../../types'
import { LeadModalShell } from '../LeadModalShell'
import { KvkBuyerSearch } from './KvkBuyerSearch'

const DEFAULT_VALUES: ManualLeadInput = {
  city: '',
  contactEmail: '',
  contactFirstName: '',
  contactLastName: '',
  contactPhone: '',
  country: DEFAULT_COUNTRY,
  houseNumber: '',
  houseNumberAddition: '',
  name: '',
  notes: '',
  postalCode: '',
  street: '',
  type: BUYER_TYPE_OPTIONS[0],
}

// Ports openAddBuyerModal + saveManualBuyer's customer self-add branch
// (osago-bundle.js:23064-23181, 23646-23753).
export const AddBuyerModal: FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const showToast = useToastStore(state => state.showToast)

  const form = useForm<ManualLeadInput>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(ManualLeadFormSchema),
  })
  const { formState, register, reset, setValue } = form
  const { errors, isSubmitting } = formState

  const close = (): void => {
    setIsOpen(false)
    reset(DEFAULT_VALUES)
  }

  const onPrefill = (prefill: KvkMergeableFields): void => {
    if (prefill.name !== undefined) setValue('name', prefill.name)
    if (prefill.street !== undefined) setValue('street', prefill.street ?? '')
    if (prefill.houseNumber !== undefined)
      setValue('houseNumber', prefill.houseNumber ?? '')
    if (prefill.houseNumberExtra !== undefined)
      setValue('houseNumberAddition', prefill.houseNumberExtra ?? '')
    if (prefill.postalCode !== undefined)
      setValue('postalCode', prefill.postalCode ?? '')
    if (prefill.city !== undefined) setValue('city', prefill.city ?? '')
    setValue('country', DEFAULT_COUNTRY)
  }

  const onSubmit = async (values: ManualLeadInput): Promise<void> => {
    const result = await addManualLead(values)
    if (result.error !== null) {
      showToast(result.error, 'error')
      return
    }
    showToast('Lead toegevoegd. Te zien onder "Handmatig toegevoegde leads".')
    close()
  }

  return (
    <>
      <button
        className="btn btn-primary"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <svg
          fill="none"
          height="13"
          stroke="currentColor"
          strokeWidth="2"
          style={{ marginRight: '4px', verticalAlign: '-2px' }}
          viewBox="0 0 24 24"
          width="13"
        >
          <line x1="12" x2="12" y1="5" y2="19" />
          <line x1="5" x2="19" y1="12" y2="12" />
        </svg>
        Handmatig toevoegen
      </button>

      {isOpen && (
        <LeadModalShell
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={close}
                type="button"
              >
                Annuleren
              </button>
              <button
                className="btn btn-primary"
                disabled={isSubmitting}
                form="add-buyer-form"
                type="submit"
              >
                {isSubmitting ? 'Bezig...' : 'Toevoegen'}
              </button>
            </>
          }
          maxWidthClassName="modal-lg"
          onClose={close}
          title="Geïnteresseerde toevoegen"
        >
          <form
            id="add-buyer-form"
            onSubmit={event => void form.handleSubmit(onSubmit)(event)}
          >
            <KvkBuyerSearch onPrefill={onPrefill} />

            <div className="form-section" style={{ marginBottom: '18px' }}>
              <h3 className="form-section-title" style={{ fontSize: '15px' }}>
                Koper / partij
              </h3>
              <p
                className="text-sm text-muted"
                style={{ margin: '-4px 0 12px' }}
              >
                Vul minimaal een bedrijfsnaam in, óf een voor- en achternaam bij
                de contactpersoon.
              </p>
              <div className="form-row">
                <div className="field">
                  <label>Bedrijfsnaam</label>
                  <input
                    placeholder="Bijv. ABC Holding"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p
                      style={{
                        color: 'var(--danger)',
                        fontSize: '13px',
                        marginTop: '4px',
                      }}
                    >
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="field">
                  <label>Type</label>
                  <select {...register('type')}>
                    {BUYER_TYPE_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section" style={{ marginBottom: '18px' }}>
              <h3 className="form-section-title" style={{ fontSize: '15px' }}>
                Contactpersoon
              </h3>
              <div className="form-row">
                <div className="field">
                  <label>Voornaam</label>
                  <input {...register('contactFirstName')} />
                </div>
                <div className="field">
                  <label>Achternaam</label>
                  <input {...register('contactLastName')} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>E-mailadres</label>
                  <input
                    placeholder="naam@bedrijf.nl"
                    type="email"
                    {...register('contactEmail')}
                  />
                </div>
                <div className="field">
                  <label>Telefoonnummer</label>
                  <input
                    placeholder="+31 6 1234 5678"
                    type="tel"
                    {...register('contactPhone')}
                  />
                </div>
              </div>
            </div>

            <div className="form-section" style={{ marginBottom: '18px' }}>
              <h3 className="form-section-title" style={{ fontSize: '15px' }}>
                Adres
              </h3>
              <div
                style={{
                  display: 'grid',
                  gap: '14px',
                  gridTemplateColumns: '2fr 1fr 1fr',
                }}
              >
                <div className="field">
                  <label>Straatnaam</label>
                  <input {...register('street')} />
                </div>
                <div className="field">
                  <label>Huisnummer</label>
                  <input {...register('houseNumber')} />
                </div>
                <div className="field">
                  <label>Toevoeging</label>
                  <input
                    placeholder="A, bis, ..."
                    {...register('houseNumberAddition')}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Postcode</label>
                  <input placeholder="1234 AB" {...register('postalCode')} />
                </div>
                <div className="field">
                  <label>Plaats</label>
                  <input {...register('city')} />
                </div>
              </div>
              <div className="field">
                <label>Land</label>
                <select {...register('country')}>
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label>Notities</label>
              <textarea rows={3} {...register('notes')} />
            </div>
          </form>
        </LeadModalShell>
      )}
    </>
  )
}
