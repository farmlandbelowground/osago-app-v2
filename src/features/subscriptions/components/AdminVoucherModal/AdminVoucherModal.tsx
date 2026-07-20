'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { type FC } from 'react'
import { useForm } from 'react-hook-form'

import { useToastStore } from '@shared/store/toast'

import { deleteVoucher, saveVoucher } from '../../actions'
import { PLANS, VOUCHER_APPLIES_TO_ALL } from '../../constants'
import {
  AdminVoucherFormSchema,
  type AdminVoucherFormInput,
} from '../../schema'
import { ModalShell } from '../ModalShell'
import { type Props } from './types'

const VALID_UNTIL_DATE_LENGTH = 10

export const AdminVoucherModal: FC<Props> = ({ onClose, voucher }) => {
  const showToast = useToastStore(state => state.showToast)

  const form = useForm<AdminVoucherFormInput>({
    defaultValues: {
      active: voucher?.active ?? true,
      appliesTo: voucher?.appliesTo ?? VOUCHER_APPLIES_TO_ALL,
      code: voucher?.code ?? '',
      description: voucher?.description ?? '',
      id: voucher?.id,
      maxUses: voucher?.maxUses ?? undefined,
      type: voucher?.type ?? 'percentage',
      validFrom: voucher?.validFrom
        ? voucher.validFrom.slice(0, VALID_UNTIL_DATE_LENGTH)
        : '',
      validUntil: voucher?.validUntil
        ? voucher.validUntil.slice(0, VALID_UNTIL_DATE_LENGTH)
        : '',
      value: voucher?.value ?? 0,
    },
    resolver: zodResolver(AdminVoucherFormSchema),
  })

  const type = form.watch('type')

  const onSubmit = async (data: AdminVoucherFormInput): Promise<void> => {
    const result = await saveVoucher(data)

    if (result.error) {
      form.setError('root', { message: result.error })
      return
    }

    showToast(voucher ? 'Vouchercode bijgewerkt.' : 'Vouchercode aangemaakt.')
    onClose()
  }

  const onDelete = async (): Promise<void> => {
    if (!voucher) {
      return
    }

    const confirmMessage =
      voucher.usedCount > 0
        ? `Deze voucher is al ${voucher.usedCount} keer gebruikt. Verwijderen verbreekt de koppeling met bestaande facturen. Weet je het zeker?`
        : 'Weet je zeker dat je deze vouchercode wilt verwijderen?'

    if (!window.confirm(confirmMessage)) {
      return
    }

    const result = await deleteVoucher(voucher.id)

    if (result.error) {
      showToast(result.error, 'error')
      return
    }

    showToast('Vouchercode verwijderd.')
    onClose()
  }

  return (
    <ModalShell
      maxWidthClassName="modal-lg"
      onClose={onClose}
      title={voucher ? 'Vouchercode bewerken' : 'Nieuwe vouchercode'}
    >
      {voucher && (
        <div className="text-sm text-muted mb-4">
          Reeds gebruikt: <strong>{voucher.usedCount}</strong> keer
        </div>
      )}

      <form onSubmit={event => void form.handleSubmit(onSubmit)(event)}>
        <div className="form-row">
          <div className="field">
            <label>Code *</label>
            <input
              placeholder="Bijv. WELKOM10"
              style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
              {...form.register('code')}
            />
            <span
              className="text-xs text-muted"
              style={{ marginTop: 4, display: 'block' }}
            >
              Hoofdletters en cijfers, geen spaties.
            </span>
            {form.formState.errors.code && (
              <p className="text-xs" style={{ color: 'var(--danger)' }}>
                {form.formState.errors.code.message}
              </p>
            )}
          </div>
          <div className="field">
            <label>Status</label>
            <label className="toggle-switch" style={{ padding: '8px 0' }}>
              <input type="checkbox" {...form.register('active')} />
              <span className="toggle-track" />
              <span className="toggle-label">Actief</span>
            </label>
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label>Type korting *</label>
            <select {...form.register('type')}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Vast bedrag</option>
            </select>
          </div>
          <div className="field">
            <label>Waarde *</label>
            <input
              placeholder={type === 'percentage' ? '10' : '500'}
              type="number"
              {...form.register('value', { valueAsNumber: true })}
            />
            <span
              className="text-xs text-muted"
              style={{ marginTop: 4, display: 'block' }}
            >
              {type === 'percentage'
                ? 'Percentage tussen 0 en 100.'
                : "Bedrag in euro's."}
            </span>
            {form.formState.errors.value && (
              <p className="text-xs" style={{ color: 'var(--danger)' }}>
                {form.formState.errors.value.message}
              </p>
            )}
          </div>
        </div>

        <div className="field">
          <label>Beschrijving</label>
          <input
            placeholder="Bijv. Welkomstkorting voor nieuwe klanten"
            {...form.register('description')}
          />
        </div>

        <div className="form-row">
          <div className="field">
            <label>Geldig vanaf (optioneel)</label>
            <input type="date" {...form.register('validFrom')} />
          </div>
          <div className="field">
            <label>Geldig t/m (optioneel)</label>
            <input type="date" {...form.register('validUntil')} />
            {form.formState.errors.validUntil && (
              <p className="text-xs" style={{ color: 'var(--danger)' }}>
                {form.formState.errors.validUntil.message}
              </p>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label>Max. aantal keer te gebruiken (optioneel)</label>
            <input
              placeholder="Onbeperkt"
              type="number"
              {...form.register('maxUses', {
                setValueAs: value => (value === '' ? undefined : Number(value)),
              })}
            />
          </div>
          <div className="field">
            <label>Geldig voor</label>
            <select {...form.register('appliesTo')}>
              <option value={VOUCHER_APPLIES_TO_ALL}>Alle abonnementen</option>
              {PLANS.map(plan => (
                <option key={plan.id} value={plan.id}>
                  Alleen {plan.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {form.formState.errors.root && (
          <p className="text-sm" style={{ color: 'var(--danger)', marginBottom: 16 }}>
            {form.formState.errors.root.message}
          </p>
        )}

        <div className="flex-between" style={{ gap: 8 }}>
          {voucher ? (
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
            <button className="btn btn-secondary" onClick={onClose} type="button">
              Annuleren
            </button>
            <button
              className="btn btn-primary"
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting
                ? 'Bezig…'
                : voucher
                  ? 'Opslaan'
                  : 'Aanmaken'}
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  )
}
