'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { type FC } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'

import { useToastStore } from '@shared/store/toast'

import { adminCreateInvoice } from '../../actions'
import {
  DEFAULT_PAYMENT_TERM_DAYS,
  DISABLED_OPACITY,
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
    <ModalShell maxWidthClassName="modal-lg" onClose={onClose} title="Nieuwe factuur">
      <div className="alert alert-info" style={{ marginBottom: 16 }}>
        <strong>Mollie verstuurt de factuur.</strong> Factuurnummer, PDF en
        betaalpagina worden door Mollie aangemaakt en per mail naar de klant
        verstuurd zodra je op &quot;Factuur versturen&quot; klikt.
      </div>

      <form onSubmit={event => void form.handleSubmit(onSubmit)(event)}>
        <div className="field">
          <label>Klant *</label>
          <select {...form.register('targetUserId')}>
            <option value="">Selecteer klant...</option>
            {customers.map(customer => (
              <option key={customer.userId} value={customer.userId}>
                {customer.label}
              </option>
            ))}
          </select>
          {form.formState.errors.targetUserId && (
            <p className="text-xs" style={{ color: 'var(--danger)' }}>
              {form.formState.errors.targetUserId.message}
            </p>
          )}
        </div>

        <div className="form-row">
          <div className="field">
            <label>Status *</label>
            <select {...form.register('status')}>
              <option value="issued">
                Verstuurd (klant ontvangt mail met betaallink)
              </option>
              <option value="draft">Concept (nog niet naar klant)</option>
            </select>
          </div>
          <div className="field">
            <label>Betaaltermijn *</label>
            <select {...form.register('paymentTermDays', { valueAsNumber: true })}>
              {PAYMENT_TERM_DAYS_OPTIONS.map(days => (
                <option key={days} value={days}>
                  {days} dagen
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Omschrijving / onderwerp *</label>
          <input {...form.register('description')} />
          <span
            className="text-xs text-muted"
            style={{ marginTop: 4, display: 'block' }}
          >
            Gebruikt als onderwerp van de e-mail die Mollie verstuurt.
          </span>
          {form.formState.errors.description && (
            <p className="text-xs" style={{ color: 'var(--danger)' }}>
              {form.formState.errors.description.message}
            </p>
          )}
        </div>

        <div className="field">
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Factuurregels *</span>
          </label>
          <div
            style={{
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                background: 'var(--line-soft)',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <span style={{ flex: 1 }}>Omschrijving</span>
              <span style={{ width: 140, textAlign: 'right', flexShrink: 0 }}>
                Bedrag (excl. BTW)
              </span>
              <span style={{ width: 22, flexShrink: 0 }} />
            </div>
            {fields.map((field, index) => (
              <div
                key={field.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <input
                  placeholder="Omschrijving"
                  style={{ flex: 1, minWidth: 0 }}
                  {...form.register(`lineItems.${index}.description`)}
                />
                <div style={{ position: 'relative', width: 140, flexShrink: 0 }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--muted)',
                      fontSize: 13,
                      pointerEvents: 'none',
                    }}
                  >
                    €
                  </span>
                  <input
                    placeholder="0,00"
                    step={MANUAL_INVOICE_LINE_ITEM_STEP}
                    style={{
                      width: '100%',
                      paddingLeft: 22,
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                    type="number"
                    {...form.register(`lineItems.${index}.netAmount`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <button
                  disabled={fields.length <= 1}
                  onClick={() => remove(index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    padding: 4,
                    cursor: fields.length <= 1 ? 'not-allowed' : 'pointer',
                    opacity: fields.length <= 1 ? DISABLED_OPACITY : 1,
                  }}
                  title="Regel verwijderen"
                  type="button"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => append({ description: '', netAmount: 0 })}
            style={{ marginTop: 8 }}
            type="button"
          >
            + Regel toevoegen
          </button>
          {form.formState.errors.lineItems?.root?.message && (
            <p className="text-xs" style={{ color: 'var(--danger)' }}>
              {form.formState.errors.lineItems.root.message}
            </p>
          )}
          <span
            className="text-xs text-muted"
            style={{ marginTop: 6, display: 'block' }}
          >
            Bedragen exclusief BTW. Mollie accepteert geen negatieve regels —
            werk kortingen/verrekeningen in in een positieve regel of pas de
            omschrijving aan.
          </span>
        </div>

        <div
          style={{
            padding: 10,
            background: '#FAFBFA',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-sm)',
            fontVariantNumeric: 'tabular-nums',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)' }}>
            <span style={{ flex: 1 }}>Subtotaal exclusief BTW</span>
            <span style={{ width: 140, textAlign: 'right', flexShrink: 0 }}>
              {formatEuro(subtotal)}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: 'var(--muted)',
              marginTop: 3,
            }}
          >
            <span style={{ flex: 1 }}>BTW 21,00%</span>
            <span style={{ width: 140, textAlign: 'right', flexShrink: 0 }}>
              {formatEuro(vatAmount)}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 600,
              marginTop: 6,
              paddingTop: 6,
              borderTop: '1px solid var(--line)',
            }}
          >
            <span style={{ flex: 1 }}>Totaal te betalen</span>
            <span style={{ width: 140, textAlign: 'right', flexShrink: 0, fontSize: 15 }}>
              {formatEuro(total)}
            </span>
          </div>
        </div>

        {form.formState.errors.root && (
          <p className="text-sm" style={{ color: 'var(--danger)', marginBottom: 16 }}>
            {form.formState.errors.root.message}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Annuleren
          </button>
          <button
            className="btn btn-primary"
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
