'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { type FC } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'

import { useToastStore } from '@shared/store/toast'

import { adminCreateInvoice } from '../../actions'
import {
  DEFAULT_PAYMENT_TERM_DAYS,
  MANUAL_INVOICE_LINE_ITEM_STEP,
  PAYMENT_TERM_DAYS_OPTIONS,
  VAT_RATE,
} from '../../constants'
import { formatEuro } from '../../lib/formatEuro'
import {
  AdminManualInvoiceFormSchema,
  type AdminManualInvoiceFormInput,
} from '../../schema'
import { ModalShell } from '../ModalShell'
import { type Props } from './types'

export const AdminInvoiceModal: FC<Props> = ({ customers, onClose }) => {
  const showToast = useToastStore(state => state.showToast)

  const form = useForm<AdminManualInvoiceFormInput>({
    defaultValues: {
      description: '',
      lineItems: [{ description: '', netAmount: 0 }],
      paymentTermDays: DEFAULT_PAYMENT_TERM_DAYS,
      status: 'issued',
      targetUserId: '',
    },
    resolver: zodResolver(AdminManualInvoiceFormSchema),
  })

  const { append, fields, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  })

  const lineItems = form.watch('lineItems')
  const subtotal = lineItems.reduce(
    (sum, item) => sum + (Number(item.netAmount) || 0),
    0,
  )
  const vatAmount = subtotal * VAT_RATE
  const total = subtotal + vatAmount

  const onSubmit = async (data: AdminManualInvoiceFormInput): Promise<void> => {
    const result = await adminCreateInvoice(data)

    if (result.error) {
      form.setError('root', { message: result.error })
      return
    }

    showToast('Factuur aangemaakt bij Mollie.')
    onClose()
  }

  return (
    <ModalShell
      maxWidthClassName="max-w-2xl"
      onClose={onClose}
      title="Nieuwe factuur"
    >
      <div
        className={`
          mb-4 rounded-md border border-info/30 bg-info/10 px-4 py-3 text-[13px]
          text-info
        `}
      >
        <strong className="font-semibold">Mollie verstuurt de factuur.</strong>{' '}
        Factuurnummer, PDF en betaalpagina worden door Mollie aangemaakt en per
        mail naar de klant verstuurd zodra je op &quot;Factuur versturen&quot;
        klikt.
      </div>

      <form onSubmit={event => void form.handleSubmit(onSubmit)(event)}>
        <div className="mb-4">
          <label
            className={`
              mb-1.5 block text-[13px] font-medium text-foreground-secondary
            `}
          >
            Klant *
          </label>
          <select
            className={`
              w-full rounded-md border border-border bg-surface px-3.5 py-2.5
              text-sm
            `}
            {...form.register('targetUserId')}
          >
            <option value="">Selecteer klant...</option>
            {customers.map(customer => (
              <option key={customer.userId} value={customer.userId}>
                {customer.label}
              </option>
            ))}
          </select>
          {form.formState.errors.targetUserId && (
            <p className="mt-1 text-xs text-destructive">
              {form.formState.errors.targetUserId.message}
            </p>
          )}
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label
              className={`
                mb-1.5 block text-[13px] font-medium text-foreground-secondary
              `}
            >
              Status *
            </label>
            <select
              className={`
                w-full rounded-md border border-border bg-surface px-3.5 py-2.5
                text-sm
              `}
              {...form.register('status')}
            >
              <option value="issued">
                Verstuurd (klant ontvangt mail met betaallink)
              </option>
              <option value="draft">Concept (nog niet naar klant)</option>
            </select>
          </div>
          <div>
            <label
              className={`
                mb-1.5 block text-[13px] font-medium text-foreground-secondary
              `}
            >
              Betaaltermijn *
            </label>
            <select
              className={`
                w-full rounded-md border border-border bg-surface px-3.5 py-2.5
                text-sm
              `}
              {...form.register('paymentTermDays', { valueAsNumber: true })}
            >
              {PAYMENT_TERM_DAYS_OPTIONS.map(days => (
                <option key={days} value={days}>
                  {days} dagen
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label
            className={`
              mb-1.5 block text-[13px] font-medium text-foreground-secondary
            `}
          >
            Omschrijving / onderwerp *
          </label>
          <input
            className={`
              w-full rounded-md border border-border bg-surface px-3.5 py-2.5
              text-sm
            `}
            {...form.register('description')}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Gebruikt als onderwerp van de e-mail die Mollie verstuurt.
          </p>
          {form.formState.errors.description && (
            <p className="mt-1 text-xs text-destructive">
              {form.formState.errors.description.message}
            </p>
          )}
        </div>

        <div
          className={`
            mb-2 grid grid-cols-[1fr_140px_auto] gap-2 text-xs font-medium
            text-muted-foreground
          `}
        >
          <span>Omschrijving</span>
          <span>Bedrag (excl. BTW)</span>
          <span />
        </div>
        {fields.map((field, index) => (
          <div
            className="mb-2 grid grid-cols-[1fr_140px_auto] items-start gap-2"
            key={field.id}
          >
            <input
              className={`
                w-full rounded-md border border-border bg-surface px-3 py-2
                text-sm
              `}
              placeholder="Omschrijving"
              {...form.register(`lineItems.${index}.description`)}
            />
            <input
              className={`
                w-full rounded-md border border-border bg-surface px-3 py-2
                text-sm
              `}
              placeholder="0,00"
              step={MANUAL_INVOICE_LINE_ITEM_STEP}
              type="number"
              {...form.register(`lineItems.${index}.netAmount`, {
                valueAsNumber: true,
              })}
            />
            <button
              className={`
                rounded-md border border-border px-2.5 py-2 text-xs
                text-destructive
                disabled:opacity-40
              `}
              disabled={fields.length <= 1}
              onClick={() => remove(index)}
              type="button"
            >
              ✕
            </button>
          </div>
        ))}
        {form.formState.errors.lineItems?.root?.message && (
          <p className="mb-2 text-xs text-destructive">
            {form.formState.errors.lineItems.root.message}
          </p>
        )}
        <button
          className={`
            mb-4 rounded-md border border-border px-3 py-1.5 text-xs
            font-semibold text-foreground
            hover:bg-border-soft
          `}
          onClick={() => append({ description: '', netAmount: 0 })}
          type="button"
        >
          + Regel toevoegen
        </button>
        <p className="mb-4 text-xs text-muted-foreground">
          Bedragen exclusief BTW. Mollie accepteert geen negatieve regels — werk
          kortingen/verrekeningen in in een positieve regel of pas de
          omschrijving aan.
        </p>

        <div
          className={`
            mb-4 rounded-md border border-border bg-background px-4 py-3.5
            text-sm
          `}
        >
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">
              Subtotaal exclusief BTW
            </span>
            <span className="text-foreground">{formatEuro(subtotal)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">BTW 21,00%</span>
            <span className="text-foreground">{formatEuro(vatAmount)}</span>
          </div>
          <div
            className={`
              mt-1 flex justify-between border-t border-border pt-2 text-base
              font-semibold
            `}
          >
            <span className="text-foreground">Totaal te betalen</span>
            <span className="text-foreground">{formatEuro(total)}</span>
          </div>
        </div>

        {form.formState.errors.root && (
          <p className="mb-4 text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            className={`
              rounded-md border border-border px-4 py-2.5 text-sm font-semibold
              text-foreground
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
              ? 'Aanmaken bij Mollie…'
              : 'Factuur versturen'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
