'use client'

import { type FC } from 'react'

import {
  BEDRIJF_MARKT_ONTWIKKELING_MAX,
  BEDRIJF_MARKT_ONTWIKKELING_MIN,
  BEDRIJF_MARKT_ONTWIKKELING_TICK_POSITIONS_PCT,
  BEDRIJF_MARKT_ONTWIKKELING_TICKS,
  LEGAL_FORM_OPTIONS,
} from '../../constants'
import { CompanyLogoUpload } from '../CompanyLogoUpload'
import { CompanyFormField } from './CompanyFormField'
import { type Props } from './types'

export const CompanyDetailsForm: FC<Props> = ({
  form,
  kvkPrefilled,
  logo,
  onSubmit,
  sectorOptions,
}) => {
  const { formState, register } = form
  const { errors, isSubmitting } = formState

  return (
    <form
      className="card"
      onSubmit={event => void form.handleSubmit(onSubmit)(event)}
    >
      <div className="form-section">
        <h3 className="form-section-title">Algemene informatie</h3>
        <p className="form-section-desc">
          Basisgegevens van jouw onderneming.
        </p>

        <div className="form-row">
          <CompanyFormField
            error={errors.name?.message}
            field="name"
            kvkPrefilled={kvkPrefilled}
            label="Bedrijfsnaam"
          >
            <input {...register('name')} />
          </CompanyFormField>

          <CompanyFormField
            error={errors.website?.message}
            field="website"
            kvkPrefilled={kvkPrefilled}
            label="Website"
          >
            <input placeholder="www.bedrijf.nl" {...register('website')} />
          </CompanyFormField>
        </div>

        <div className="form-row">
          <CompanyFormField
            error={errors.sector?.message}
            kvkPrefilled={kvkPrefilled}
            label="Sector"
          >
            <select {...register('sector')}>
              <option value="">Selecteer sector...</option>
              {sectorOptions.map(option => (
                <option key={option.id} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </CompanyFormField>

          <CompanyFormField
            error={errors.legalForm?.message}
            field="legalForm"
            kvkPrefilled={kvkPrefilled}
            label="Ondernemingsvorm"
          >
            <select {...register('legalForm')}>
              <option value="">Selecteer ondernemingsvorm...</option>
              {LEGAL_FORM_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </CompanyFormField>
        </div>

        <div className="form-row" style={{ gridTemplateColumns: '1fr 110px 130px' }}>
          <CompanyFormField
            error={errors.street?.message}
            field="street"
            kvkPrefilled={kvkPrefilled}
            label="Straatnaam"
          >
            <input placeholder="Bijv. Herengracht" {...register('street')} />
          </CompanyFormField>

          <CompanyFormField
            error={errors.houseNumber?.message}
            field="houseNumber"
            kvkPrefilled={kvkPrefilled}
            label="Huisnummer"
          >
            <input placeholder="124" {...register('houseNumber')} />
          </CompanyFormField>

          <CompanyFormField
            error={errors.houseNumberExtra?.message}
            field="houseNumberExtra"
            kvkPrefilled={kvkPrefilled}
            label="Toevoeging"
          >
            <input placeholder="bv. B" {...register('houseNumberExtra')} />
          </CompanyFormField>
        </div>

        <div className="form-row" style={{ gridTemplateColumns: '140px 1fr' }}>
          <CompanyFormField
            error={errors.postalCode?.message}
            field="postalCode"
            kvkPrefilled={kvkPrefilled}
            label="Postcode"
          >
            <input placeholder="1015 BU" {...register('postalCode')} />
          </CompanyFormField>

          <CompanyFormField
            error={errors.city?.message}
            field="city"
            kvkPrefilled={kvkPrefilled}
            label="Plaats"
          >
            <input placeholder="Bijv. Amsterdam" {...register('city')} />
          </CompanyFormField>
        </div>

        <div className="form-row">
          <CompanyFormField
            error={errors.founded?.message}
            field="founded"
            kvkPrefilled={kvkPrefilled}
            label="Oprichtingsjaar"
          >
            <input
              type="number"
              {...register('founded', { valueAsNumber: true })}
            />
          </CompanyFormField>

          <CompanyFormField
            error={errors.employees?.message}
            field="employees"
            kvkPrefilled={kvkPrefilled}
            label="Aantal medewerkers (FTE)"
          >
            <input
              type="number"
              {...register('employees', { valueAsNumber: true })}
            />
          </CompanyFormField>
        </div>

        <CompanyFormField
          error={errors.description?.message}
          kvkPrefilled={kvkPrefilled}
          label="Korte bedrijfsomschrijving"
        >
          <textarea
            placeholder="Wat doet jouw bedrijf? Voor wie? Wat is jouw waardepropositie?"
            rows={3}
            {...register('description')}
          />
        </CompanyFormField>

        <CompanyFormField
          error={errors.usp?.message}
          kvkPrefilled={kvkPrefilled}
          label="Unique Selling Point (USP)"
        >
          <textarea
            placeholder="Wat maakt jouw bedrijf onderscheidend in de markt?"
            rows={2}
            {...register('usp')}
          />
        </CompanyFormField>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Bedrijfslogo</h3>
        <p className="form-section-desc">
          Een logo verschijnt op jouw verkoopmemorandum, presentatie en
          gegenereerde documenten.
        </p>
        <CompanyLogoUpload logo={logo} />
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Jouw situatie</h3>
        <p className="form-section-desc">
          Een heldere achtergrond draagt bij aan vertrouwen bij potentiële
          kopers en helpt ons jouw traject beter aan te laten sluiten.
        </p>
        <CompanyFormField
          error={errors.reasonForSale?.message}
          kvkPrefilled={kvkPrefilled}
          label="Reden voor verkoop of waardering"
        >
          <textarea
            placeholder="Bijv. pensionering, focus op andere activiteiten, behoefte aan een sterkere groeipartner, inzicht in de waarde t.b.v. successieplanning..."
            rows={2}
            {...register('reasonForSale')}
          />
        </CompanyFormField>
      </div>

      <div className="form-section">
        <div className="vd-question" style={{ margin: 0 }}>
          <div className="vd-question-title">
            Geef aan in hoeverre jouw bedrijf en/of markt in ontwikkeling
            zijn.
          </div>
          <div className="vd-slider-block">
            <div className="vd-slider-labels">
              <span className="vd-slider-label is-first" style={{ left: '0%' }}>
                geen ontwikkelingen
              </span>
              <span className="vd-slider-label is-last" style={{ left: '100%' }}>
                erg in ontwikkeling
              </span>
            </div>
            <input
              className="vd-slider"
              max={BEDRIJF_MARKT_ONTWIKKELING_MAX}
              min={BEDRIJF_MARKT_ONTWIKKELING_MIN}
              step={1}
              type="range"
              {...register('bedrijfMarktOntwikkeling', { valueAsNumber: true })}
            />
            <div className="vd-slider-ticks">
              {BEDRIJF_MARKT_ONTWIKKELING_TICKS.map((tick, index) => (
                <span
                  className="vd-slider-tick"
                  key={tick}
                  style={{
                    left: `${BEDRIJF_MARKT_ONTWIKKELING_TICK_POSITIONS_PCT[index]}%`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {errors.root && (
        <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>
          {errors.root.message}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button className="btn btn-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Bezig...' : 'Profiel opslaan'}
        </button>
      </div>
    </form>
  )
}
