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
      onClose={onClose}
      title={voucher ? 'Vouchercode bewerken' : 'Nieuwe vouchercode'}
    >
      {voucher && (
        <p className="mb-4 text-sm text-foreground">
          Reeds gebruikt:{' '}
          <span className="font-semibold">{voucher.usedCount}</span> keer
        </p>
      )}

      <form onSubmit={event => void form.handleSubmit(onSubmit)(event)}>
        <div className="mb-4 flex items-end gap-3">
          <div className="flex-1">
            <label
              className={`
                mb-1.5 block text-[13px] font-medium text-foreground-secondary
              `}
            >
              Code *
            </label>
            <input
              className={`
                w-full rounded-md border border-border bg-surface px-3.5 py-2.5
                text-sm tracking-widest uppercase
              `}
              placeholder="Bijv. WELKOM10"
              {...form.register('code')}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Hoofdletters en cijfers, geen spaties.
            </p>
            {form.formState.errors.code && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.code.message}
              </p>
            )}
          </div>
          <label
            className={`
              mb-1 flex items-center gap-2 text-sm font-medium text-foreground
            `}
          >
            <input type="checkbox" {...form.register('active')} />
            Actief
          </label>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label
              className={`
                mb-1.5 block text-[13px] font-medium text-foreground-secondary
              `}
            >
              Type korting *
            </label>
            <select
              className={`
                w-full rounded-md border border-border bg-surface px-3.5 py-2.5
                text-sm
              `}
              {...form.register('type')}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Vast bedrag</option>
            </select>
          </div>
          <div>
            <label
              className={`
                mb-1.5 block text-[13px] font-medium text-foreground-secondary
              `}
            >
              Waarde *
            </label>
            <input
              className={`
                w-full rounded-md border border-border bg-surface px-3.5 py-2.5
                text-sm
              `}
              placeholder={type === 'percentage' ? '10' : '500'}
              type="number"
              {...form.register('value', { valueAsNumber: true })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {type === 'percentage'
                ? 'Percentage tussen 0 en 100.'
                : "Bedrag in euro's."}
            </p>
            {form.formState.errors.value && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.value.message}
              </p>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label
            className={`
              mb-1.5 block text-[13px] font-medium text-foreground-secondary
            `}
          >
            Beschrijving
          </label>
          <input
            className={`
              w-full rounded-md border border-border bg-surface px-3.5 py-2.5
              text-sm
            `}
            placeholder="Bijv. Welkomstkorting voor nieuwe klanten"
            {...form.register('description')}
          />
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label
              className={`
                mb-1.5 block text-[13px] font-medium text-foreground-secondary
              `}
            >
              Geldig vanaf (optioneel)
            </label>
            <input
              className={`
                w-full rounded-md border border-border bg-surface px-3.5 py-2.5
                text-sm
              `}
              type="date"
              {...form.register('validFrom')}
            />
          </div>
          <div>
            <label
              className={`
                mb-1.5 block text-[13px] font-medium text-foreground-secondary
              `}
            >
              Geldig t/m (optioneel)
            </label>
            <input
              className={`
                w-full rounded-md border border-border bg-surface px-3.5 py-2.5
                text-sm
              `}
              type="date"
              {...form.register('validUntil')}
            />
            {form.formState.errors.validUntil && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.validUntil.message}
              </p>
            )}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label
              className={`
                mb-1.5 block text-[13px] font-medium text-foreground-secondary
              `}
            >
              Max. aantal keer te gebruiken (optioneel)
            </label>
            <input
              className={`
                w-full rounded-md border border-border bg-surface px-3.5 py-2.5
                text-sm
              `}
              placeholder="Onbeperkt"
              type="number"
              {...form.register('maxUses', {
                setValueAs: value => (value === '' ? undefined : Number(value)),
              })}
            />
          </div>
          <div>
            <label
              className={`
                mb-1.5 block text-[13px] font-medium text-foreground-secondary
              `}
            >
              Geldig voor
            </label>
            <select
              className={`
                w-full rounded-md border border-border bg-surface px-3.5 py-2.5
                text-sm
              `}
              {...form.register('appliesTo')}
            >
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
          <p className="mb-4 text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          {voucher ? (
            <button
              className={`
                text-sm font-semibold text-destructive
                hover:underline
              `}
              onClick={() => void onDelete()}
              type="button"
            >
              Verwijderen
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              className={`
                rounded-md border border-border px-4 py-2.5 text-sm
                font-semibold text-foreground
                hover:bg-border-soft
              `}
              onClick={onClose}
              type="button"
            >
              Annuleren
            </button>
            <button
              className={`
                rounded-md bg-primary px-4 py-2.5 text-sm font-semibold
                text-primary-foreground transition
                hover:bg-primary-hover
                disabled:opacity-50
              `}
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
