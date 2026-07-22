'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { type CSSProperties, type FC, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { TurnstileWidget } from '@features/auth/components/TurnstileWidget'

import { createBooking } from '../../actions'
import {
  BookingDetailsFormSchema,
  type BookingDetailsFormInput,
} from '../../schema'
import { type Props } from './types'

export const BookingDetailsForm: FC<Props> = ({
  onBack,
  onConfirmed,
  prefill,
  slot,
  type,
}) => {
  const formRef = useRef<HTMLFormElement>(null)
  const [resetSignal, setResetSignal] = useState(0)

  const form = useForm<BookingDetailsFormInput>({
    defaultValues: {
      email: prefill?.email ?? '',
      firstName: prefill?.firstName ?? '',
      lastName: prefill?.lastName ?? '',
      notes: '',
      phone: prefill?.phone ?? '',
    },
    resolver: zodResolver(BookingDetailsFormSchema),
  })

  const hasPrefill = Boolean(
    prefill?.firstName || prefill?.lastName || prefill?.email || prefill?.phone,
  )

  const inputStyle: CSSProperties = {
    background: '#fff',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-sm)',
    boxSizing: 'border-box',
    fontSize: 14,
    padding: '10px 12px',
    width: '100%',
  }

  const onSubmit = async (data: BookingDetailsFormInput): Promise<void> => {
    const token = formRef.current
      ? String(new FormData(formRef.current).get('turnstileToken') ?? '')
      : ''

    const result = await createBooking({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      notes: data.notes,
      phone: data.phone,
      preferredAdminId: slot.adminId,
      startsAt: slot.startsAt,
      turnstileToken: token,
      typeSlug: type.slug,
    })

    if (!result.ok) {
      form.setError('root', { message: result.error })
      setResetSignal(signal => signal + 1)
      return
    }

    onConfirmed(result)
  }

  return (
    <form
      onSubmit={event => void form.handleSubmit(onSubmit)(event)}
      ref={formRef}
    >
      {hasPrefill && (
        <div
          style={{
            background: 'var(--green-soft)',
            border: '1px solid var(--green)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--green-dark)',
            fontSize: 12.5,
            lineHeight: 1.5,
            marginBottom: 16,
            padding: '10px 14px',
          }}
        >
          ✓ Wij hebben jouw gegevens alvast voor je ingevuld. Pas ze aan indien
          nodig.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            display: 'grid',
            gap: 10,
            gridTemplateColumns: '1fr 1fr',
          }}
        >
          <div>
            <input
              placeholder="Voornaam *"
              style={inputStyle}
              type="text"
              {...form.register('firstName')}
            />
            {form.formState.errors.firstName && (
              <p className="text-xs" style={{ color: 'var(--danger)' }}>
                {form.formState.errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <input
              placeholder="Achternaam *"
              style={inputStyle}
              type="text"
              {...form.register('lastName')}
            />
            {form.formState.errors.lastName && (
              <p className="text-xs" style={{ color: 'var(--danger)' }}>
                {form.formState.errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <input
            placeholder="E-mailadres *"
            style={inputStyle}
            type="email"
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="text-xs" style={{ color: 'var(--danger)' }}>
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div>
          <input
            placeholder="Telefoonnummer *"
            style={inputStyle}
            type="tel"
            {...form.register('phone')}
          />
          {form.formState.errors.phone && (
            <p className="text-xs" style={{ color: 'var(--danger)' }}>
              {form.formState.errors.phone.message}
            </p>
          )}
        </div>

        <div>
          <textarea
            placeholder="Waarover wil je het hebben tijdens de afspraak? *"
            rows={4}
            style={{
              ...inputStyle,
              fontFamily: 'inherit',
              minHeight: 96,
              resize: 'vertical',
            }}
            {...form.register('notes')}
          />
          {form.formState.errors.notes && (
            <p className="text-xs" style={{ color: 'var(--danger)' }}>
              {form.formState.errors.notes.message}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
        <TurnstileWidget name="turnstileToken" resetSignal={resetSignal} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{ minWidth: 100 }}
          type="button"
        >
          ‹ Terug
        </button>
        <button
          className="btn btn-primary"
          disabled={form.formState.isSubmitting}
          style={{ flex: 1 }}
          type="submit"
        >
          {form.formState.isSubmitting ? 'Bezig…' : 'Afspraak inplannen'}
        </button>
      </div>

      {form.formState.errors.root && (
        <p
          className="text-sm"
          style={{ color: 'var(--danger)', marginTop: 10, textAlign: 'center' }}
        >
          {form.formState.errors.root.message}
        </p>
      )}

      <div
        className="text-xs text-muted"
        style={{ marginTop: 10, textAlign: 'center' }}
      >
        Alle velden zijn verplicht.
      </div>
    </form>
  )
}
