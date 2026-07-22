'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { type ChangeEvent, type FC, useRef } from 'react'
import { useForm } from 'react-hook-form'

import { describeVoucher } from '@features/subscriptions/lib/describeVoucher'
import { ModalShell } from '@shared/components/ModalShell'
import { useToastStore } from '@shared/store/toast'

import { adminDeletePartner, adminSavePartner } from '../../actions'
import { buildPartnerRegistrationUrl } from '../../lib/partnerRegistrationUrl'
import { slugifyPartnerName } from '../../lib/slug'
import { AdminPartnerFormSchema, type PartnerFormInput } from '../../schema'
import { PartnerLogoField } from '../PartnerLogoField'
import { type Props } from './types'

export const AdminPartnerModal: FC<Props> = ({
  onClose,
  partner,
  vouchers,
}) => {
  const showToast = useToastStore(state => state.showToast)

  const form = useForm<PartnerFormInput>({
    defaultValues: {
      active: partner?.active ?? true,
      contactEmail: partner?.contactEmail ?? '',
      contactPerson: partner?.contactPerson ?? '',
      contactPhone: partner?.contactPhone ?? '',
      description: partner?.description ?? '',
      id: partner?.id,
      logo: partner?.logo ?? '',
      name: partner?.name ?? '',
      slug: partner?.slug ?? '',
      voucherId: partner?.voucherId ?? '',
    },
    resolver: zodResolver(AdminPartnerFormSchema),
  })

  // Auto-fill the slug from the name as the admin types, while the slug is still
  // empty or was itself auto-filled — ports legacy updatePartnerSlugPreview
  // (osago-bundle.js:26515). Editing an existing partner keeps its saved slug.
  const autoFilledRef = useRef(false)

  const onNameChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (!form.getValues('slug') || autoFilledRef.current) {
      form.setValue('slug', slugifyPartnerName(event.target.value))
      autoFilledRef.current = true
    }
  }

  const nameValue = form.watch('name')
  const slugValue = form.watch('slug')
  const logoValue = form.watch('logo') ?? ''
  const previewSlug = slugifyPartnerName(slugValue || nameValue)
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  const registrationUrl = buildPartnerRegistrationUrl(previewSlug, origin)

  const sortedVouchers = [...vouchers].sort((a, b) =>
    a.code.localeCompare(b.code),
  )

  const onSubmit = async (data: PartnerFormInput): Promise<void> => {
    const result = await adminSavePartner(data)
    if (result.error) {
      form.setError('root', { message: result.error })
      return
    }

    showToast(partner ? 'Partner bijgewerkt.' : 'Partner toegevoegd.')
    onClose()
  }

  const onDelete = async (): Promise<void> => {
    if (!partner) {
      return
    }

    if (
      !window.confirm('Weet je zeker dat je deze partner wilt verwijderen?')
    ) {
      return
    }

    const result = await adminDeletePartner(partner.id)
    if (result.error) {
      showToast(result.error, 'error')
      return
    }

    showToast('Partner verwijderd.')
    onClose()
  }

  const onCopy = (): void => {
    void navigator.clipboard.writeText(registrationUrl)
    showToast('Registratielink gekopieerd naar klembord.')
  }

  return (
    <ModalShell
      maxWidthClassName="modal-lg"
      onClose={onClose}
      title={partner ? `Partner — ${partner.name}` : 'Nieuwe partner'}
    >
      <form onSubmit={event => void form.handleSubmit(onSubmit)(event)}>
        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="field">
            <label>Naam *</label>
            <input
              placeholder="Naam van de partner"
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
            <label>Slug (URL-segment) *</label>
            <input
              pattern="[a-z0-9-]+"
              placeholder="auto op basis van naam"
              type="text"
              {...form.register('slug')}
            />
            <span
              className="text-xs text-muted"
              style={{ display: 'block', marginTop: 4 }}
            >
              Alleen kleine letters, cijfers en streepjes. Wordt deel van de
              registratielink.
            </span>
            {form.formState.errors.slug && (
              <p className="text-xs" style={{ color: 'var(--danger)' }}>
                {form.formState.errors.slug.message}
              </p>
            )}
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="field">
            <label>Contactpersoon</label>
            <input
              placeholder="Naam contactpersoon"
              type="text"
              {...form.register('contactPerson')}
            />
          </div>
          <div className="field">
            <label>Contact e-mailadres</label>
            <input
              placeholder="contact@partner.nl"
              type="email"
              {...form.register('contactEmail')}
            />
            {form.formState.errors.contactEmail && (
              <p className="text-xs" style={{ color: 'var(--danger)' }}>
                {form.formState.errors.contactEmail.message}
              </p>
            )}
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="field">
            <label>Contact telefoonnummer</label>
            <input
              placeholder="+31 ..."
              type="tel"
              {...form.register('contactPhone')}
            />
          </div>
          <div className="field">
            <label>Status</label>
            <label className="toggle-switch" style={{ padding: '6px 0' }}>
              <input type="checkbox" {...form.register('active')} />
              <span className="toggle-track" />
              <span className="toggle-label">
                Actief — registratielink werkt en partner is zichtbaar in
                overzicht
              </span>
            </label>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label>Korte introductie (optioneel)</label>
          <textarea
            placeholder="Bijv. 'Boekhouder gespecialiseerd in MKB-overnames in Brabant.' — komt op de partner-registratiepagina te staan."
            rows={2}
            style={{
              fontFamily: 'inherit',
              lineHeight: 1.5,
              resize: 'vertical',
            }}
            {...form.register('description')}
          />
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label>Logo (optioneel)</label>
          <PartnerLogoField
            logo={logoValue}
            onChange={value =>
              form.setValue('logo', value, { shouldDirty: true })
            }
          />
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label>Gekoppelde vouchercode (optioneel)</label>
          <select {...form.register('voucherId')}>
            <option value="">— Geen voucher —</option>
            {sortedVouchers.map(voucher => (
              <option key={voucher.id} value={voucher.id}>
                {voucher.code} — {describeVoucher(voucher)}
                {voucher.active ? '' : ' (uit)'}
              </option>
            ))}
          </select>
          <span
            className="text-xs text-muted"
            style={{ display: 'block', marginTop: 4 }}
          >
            Wordt op de partner-registratiepagina getoond als partnerkorting. De
            klant voert de code zelf in bij het afsluiten van een abonnement.
          </span>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>Registratielink (preview)</label>
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
              value={registrationUrl}
            />
            {partner ? (
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

        <div className="flex-between" style={{ gap: 8, marginTop: 20 }}>
          {partner ? (
            <button
              className="btn btn-danger"
              onClick={() => void onDelete()}
              type="button"
            >
              Verwijderen
            </button>
          ) : (
            <span />
          )}
          <div style={{ display: 'flex', gap: 8 }}>
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
                : partner
                  ? 'Wijzigingen opslaan'
                  : 'Partner aanmaken'}
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  )
}
