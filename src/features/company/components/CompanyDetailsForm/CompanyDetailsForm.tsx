'use client'

import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import {
  BEDRIJF_MARKT_ONTWIKKELING_MAX,
  BEDRIJF_MARKT_ONTWIKKELING_MIN,
  BEDRIJF_MARKT_ONTWIKKELING_TICKS,
  LEGAL_FORM_OPTIONS,
} from '../../constants'
import { CompanyLogoUpload } from '../CompanyLogoUpload'
import { CompanyFormField } from './CompanyFormField'
import { type Props } from './types'

const inputClassName = (className?: string): string =>
  cn(
    `
      w-full rounded-md border border-border bg-surface px-3.5 py-3
      transition-[border-color,box-shadow] duration-150
      focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,179,60,0.1)]
      focus:outline-none
    `,
    className,
  )

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
      className="rounded-lg border border-border bg-surface p-6 shadow-sm"
      onSubmit={event => void form.handleSubmit(onSubmit)(event)}
    >
      <div className="mb-6">
        <h3 className={`
          mb-1 pt-3 font-serif text-[17px] font-medium text-foreground
        `}>
          Algemene informatie
        </h3>
        <p className="mb-4 text-[13px] text-muted-foreground">
          Basisgegevens van jouw onderneming.
        </p>

        <div className="grid grid-cols-2 gap-3.5">
          <CompanyFormField
            error={errors.name?.message}
            field="name"
            kvkPrefilled={kvkPrefilled}
            label="Bedrijfsnaam"
          >
            <input className={inputClassName()} {...register('name')} />
          </CompanyFormField>

          <CompanyFormField
            error={errors.website?.message}
            field="website"
            kvkPrefilled={kvkPrefilled}
            label="Website"
          >
            <input
              className={inputClassName()}
              placeholder="www.bedrijf.nl"
              {...register('website')}
            />
          </CompanyFormField>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <CompanyFormField
            error={errors.sector?.message}
            kvkPrefilled={kvkPrefilled}
            label="Sector"
          >
            <select className={inputClassName()} {...register('sector')}>
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
            <select className={inputClassName()} {...register('legalForm')}>
              <option value="">Selecteer ondernemingsvorm...</option>
              {LEGAL_FORM_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </CompanyFormField>
        </div>

        <div className="grid grid-cols-[1fr_110px_130px] gap-3.5">
          <CompanyFormField
            error={errors.street?.message}
            field="street"
            kvkPrefilled={kvkPrefilled}
            label="Straatnaam"
          >
            <input
              className={inputClassName()}
              placeholder="Bijv. Herengracht"
              {...register('street')}
            />
          </CompanyFormField>

          <CompanyFormField
            error={errors.houseNumber?.message}
            field="houseNumber"
            kvkPrefilled={kvkPrefilled}
            label="Huisnummer"
          >
            <input
              className={inputClassName()}
              placeholder="124"
              {...register('houseNumber')}
            />
          </CompanyFormField>

          <CompanyFormField
            error={errors.houseNumberExtra?.message}
            field="houseNumberExtra"
            kvkPrefilled={kvkPrefilled}
            label="Toevoeging"
          >
            <input
              className={inputClassName()}
              placeholder="bv. B"
              {...register('houseNumberExtra')}
            />
          </CompanyFormField>
        </div>

        <div className="grid grid-cols-[140px_1fr] gap-3.5">
          <CompanyFormField
            error={errors.postalCode?.message}
            field="postalCode"
            kvkPrefilled={kvkPrefilled}
            label="Postcode"
          >
            <input
              className={inputClassName()}
              placeholder="1015 BU"
              {...register('postalCode')}
            />
          </CompanyFormField>

          <CompanyFormField
            error={errors.city?.message}
            field="city"
            kvkPrefilled={kvkPrefilled}
            label="Plaats"
          >
            <input
              className={inputClassName()}
              placeholder="Bijv. Amsterdam"
              {...register('city')}
            />
          </CompanyFormField>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <CompanyFormField
            error={errors.founded?.message}
            field="founded"
            kvkPrefilled={kvkPrefilled}
            label="Oprichtingsjaar"
          >
            <input
              className={inputClassName()}
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
              className={inputClassName()}
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
            className={inputClassName()}
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
            className={inputClassName()}
            placeholder="Wat maakt jouw bedrijf onderscheidend in de markt?"
            rows={2}
            {...register('usp')}
          />
        </CompanyFormField>
      </div>

      <div className="mb-6">
        <h3 className={`
          mb-1 pt-3 font-serif text-[17px] font-medium text-foreground
        `}>
          Bedrijfslogo
        </h3>
        <p className="mb-4 text-[13px] text-muted-foreground">
          Een logo verschijnt op jouw verkoopmemorandum, presentatie en
          gegenereerde documenten.
        </p>
        <CompanyLogoUpload logo={logo} />
      </div>

      <div className="mb-6">
        <h3 className={`
          mb-1 pt-3 font-serif text-[17px] font-medium text-foreground
        `}>
          Jouw situatie
        </h3>
        <p className="mb-4 text-[13px] text-muted-foreground">
          Een heldere achtergrond draagt bij aan vertrouwen bij potentiële
          kopers en helpt ons jouw traject beter aan te laten sluiten.
        </p>
        <CompanyFormField
          error={errors.reasonForSale?.message}
          kvkPrefilled={kvkPrefilled}
          label="Reden voor verkoop of waardering"
        >
          <textarea
            className={inputClassName()}
            placeholder="Bijv. pensionering, focus op andere activiteiten, behoefte aan een sterkere groeipartner, inzicht in de waarde t.b.v. successieplanning..."
            rows={2}
            {...register('reasonForSale')}
          />
        </CompanyFormField>
      </div>

      <div className="py-[18px]">
        <p className={`
          mb-3.5 text-[14.5px] leading-snug font-semibold text-foreground
        `}>
          Geef aan in hoeverre jouw bedrijf en/of markt in ontwikkeling zijn.
        </p>
        <div className="px-[11px] pt-1.5">
          <div className={`
            mb-3.5 flex items-center justify-between text-[11.5px]
            text-muted-foreground
          `}>
            <span>geen ontwikkelingen</span>
            <span>erg in ontwikkeling</span>
          </div>
          <input
            className={cn(
              `
                h-1.5 w-full cursor-pointer appearance-none rounded-full
                bg-border outline-none
              `,
              `
                [&::-webkit-slider-thumb]:h-[22px]
                [&::-webkit-slider-thumb]:w-[22px]
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:border-[3px]
                [&::-webkit-slider-thumb]:border-surface
                [&::-webkit-slider-thumb]:bg-primary
                [&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(0,0,0,0.18)]
              `,
              `
                [&::-moz-range-thumb]:h-[22px] [&::-moz-range-thumb]:w-[22px]
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:border-[3px]
                [&::-moz-range-thumb]:border-surface
                [&::-moz-range-thumb]:bg-primary
                [&::-moz-range-thumb]:shadow-[0_1px_4px_rgba(0,0,0,0.18)]
              `,
            )}
            max={BEDRIJF_MARKT_ONTWIKKELING_MAX}
            min={BEDRIJF_MARKT_ONTWIKKELING_MIN}
            step={1}
            type="range"
            {...register('bedrijfMarktOntwikkeling', { valueAsNumber: true })}
          />
          <div className="mt-1.5 flex items-center justify-between">
            {BEDRIJF_MARKT_ONTWIKKELING_TICKS.map(tick => (
              <span className="h-1.5 w-px bg-border" key={tick} />
            ))}
          </div>
        </div>
      </div>

      {errors.root && (
        <p className="mb-4 text-sm text-destructive">{errors.root.message}</p>
      )}

      <div className="flex justify-end">
        <button
          className={cn(
            `
              inline-flex items-center justify-center gap-2 rounded-md
              bg-primary px-5 py-3 text-[15px] font-semibold
              text-primary-foreground transition
              hover:-translate-y-px hover:bg-primary-hover
            `,
            'disabled:opacity-50 disabled:hover:translate-y-0',
          )}
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Bezig...' : 'Profiel opslaan'}
        </button>
      </div>
    </form>
  )
}
