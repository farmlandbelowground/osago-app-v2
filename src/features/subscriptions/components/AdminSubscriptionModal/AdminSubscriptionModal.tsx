'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { type FC } from 'react'
import { useForm } from 'react-hook-form'

import { useToastStore } from '@shared/store/toast'

import { adminCancelSubscription, adminSaveSubscription } from '../../actions'
import { PLANS, SUBSCRIPTION_DURATION_MONTHS } from '../../constants'
import { addMonths } from '../../lib/addMonths'
import { toDateOnly } from '../../lib/toDateOnly'
import {
  AdminSubscriptionFormSchema,
  type AdminSubscriptionFormInput,
} from '../../schema'
import { ModalShell } from '../ModalShell'
import { type Props } from './types'

export const AdminSubscriptionModal: FC<Props> = ({
  customers,
  onClose,
  subscription,
}) => {
  const showToast = useToastStore(state => state.showToast)
  const hasExisting = subscription !== null && subscription.type !== null
  const defaultPlan = PLANS[0]
  const today = toDateOnly(new Date())

  const form = useForm<AdminSubscriptionFormInput>({
    defaultValues: {
      autoRenew: subscription?.autoRenew ?? true,
      endDate:
        subscription?.endDate ??
        toDateOnly(addMonths(new Date(), SUBSCRIPTION_DURATION_MONTHS)),
      planId: subscription?.type ?? defaultPlan.id,
      price: subscription?.price ?? defaultPlan.price,
      startDate: subscription?.startDate ?? today,
      userId: subscription?.userId ?? '',
    },
    resolver: zodResolver(AdminSubscriptionFormSchema),
  })

  const onSelectPlan = (planId: AdminSubscriptionFormInput['planId']): void => {
    const plan = PLANS.find(candidate => candidate.id === planId)
    form.setValue('planId', planId, { shouldDirty: true })

    if (plan) {
      form.setValue('price', plan.price, { shouldDirty: true })
    }
  }

  const onSetEndDateFromStart = (): void => {
    const startDate = form.getValues('startDate')

    if (!startDate) {
      return
    }

    form.setValue(
      'endDate',
      toDateOnly(addMonths(new Date(startDate), SUBSCRIPTION_DURATION_MONTHS)),
      { shouldDirty: true },
    )
  }

  const onCancelSubscription = async (): Promise<void> => {
    if (!subscription) {
      return
    }

    if (
      !window.confirm(
        'Weet je zeker dat je dit abonnement wilt beëindigen? De klant houdt nog toegang tot de einddatum.',
      )
    ) {
      return
    }

    const result = await adminCancelSubscription(subscription.userId)

    if (result.error) {
      showToast(result.error, 'error')
      return
    }

    showToast('Abonnement beëindigd.')
    onClose()
  }

  const onSubmit = async (data: AdminSubscriptionFormInput): Promise<void> => {
    const result = await adminSaveSubscription(data)

    if (result.error) {
      form.setError('root', { message: result.error })
      return
    }

    showToast(
      hasExisting ? 'Abonnement bijgewerkt.' : 'Abonnement geactiveerd.',
    )
    onClose()
  }

  const submitLabel = hasExisting
    ? 'Opslaan'
    : subscription
      ? 'Activeren'
      : 'Toevoegen'

  return (
    <ModalShell
      maxWidthClassName="modal-lg"
      onClose={onClose}
      title={hasExisting ? 'Abonnement beheren' : 'Nieuw abonnement'}
    >
      <form onSubmit={event => void form.handleSubmit(onSubmit)(event)}>
        {subscription ? (
          <div className="text-sm text-muted mb-4">
            Klant:{' '}
            <strong style={{ color: 'var(--ink)' }}>
              {customers.find(
                customer => customer.userId === subscription.userId,
              )?.label ?? subscription.userId}
            </strong>
          </div>
        ) : (
          <div className="field" style={{ marginBottom: 18 }}>
            <label>Klant *</label>
            <select {...form.register('userId')}>
              <option value="">Selecteer klant...</option>
              {customers.map(customer => (
                <option key={customer.userId} value={customer.userId}>
                  {customer.label}
                </option>
              ))}
            </select>
            {form.formState.errors.userId && (
              <p className="text-xs" style={{ color: 'var(--danger)' }}>
                {form.formState.errors.userId.message}
              </p>
            )}
          </div>
        )}

        <div className="form-section" style={{ marginBottom: 18 }}>
          <h3 className="form-section-title" style={{ fontSize: 15 }}>
            Abonnementstype
          </h3>

          <div
            className="text-xs text-muted fw-600"
            style={{ textTransform: 'uppercase', letterSpacing: '0.05em', margin: '8px 0 6px' }}
          >
            Volledige abonnementen
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
              marginBottom: 8,
            }}
          >
            {PLANS.filter(plan => plan.category === 'full').map(plan => (
              <label
                key={plan.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  padding: 12,
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: '#fff',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    checked={form.watch('planId') === plan.id}
                    onChange={() => onSelectPlan(plan.id)}
                    style={{ accentColor: 'var(--green)' }}
                    type="radio"
                    value={plan.id}
                  />
                  <strong>{plan.label}</strong>
                </span>
                <span className="text-xs text-muted">{plan.desc}</span>
                <span className="text-sm" style={{ marginTop: 4 }}>
                  <strong>€{plan.price}</strong> per 6 maanden
                </span>
              </label>
            ))}
          </div>

          <div
            className="text-xs text-muted fw-600"
            style={{ textTransform: 'uppercase', letterSpacing: '0.05em', margin: '8px 0 6px' }}
          >
            Alleen Waardebepaling
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
              marginBottom: 8,
            }}
          >
            {PLANS.filter(plan => plan.category === 'valuation').map(plan => (
              <label
                key={plan.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  padding: 12,
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: '#fff',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    checked={form.watch('planId') === plan.id}
                    onChange={() => onSelectPlan(plan.id)}
                    style={{ accentColor: 'var(--green)' }}
                    type="radio"
                    value={plan.id}
                  />
                  <strong>{plan.label}</strong>
                </span>
                <span className="text-xs text-muted">{plan.desc}</span>
                <span className="text-sm" style={{ marginTop: 4 }}>
                  <strong>€{plan.price}</strong>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="field">
            <label>Prijs per 6 maanden (€)</label>
            <input
              type="number"
              {...form.register('price', { valueAsNumber: true })}
            />
            {form.formState.errors.price && (
              <p className="text-xs" style={{ color: 'var(--danger)' }}>
                {form.formState.errors.price.message}
              </p>
            )}
          </div>
          <div className="field">
            <label>Startdatum</label>
            <input type="date" {...form.register('startDate')} />
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="field">
            <label>Einddatum (looptijd standaard 6 maanden)</label>
            <input type="date" {...form.register('endDate')} />
          </div>
          <div className="field" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={onSetEndDateFromStart}
              type="button"
            >
              + 6 maanden vanaf startdatum
            </button>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label className="toggle-switch" style={{ padding: '6px 0' }}>
            <input type="checkbox" {...form.register('autoRenew')} />
            <span className="toggle-track" />
            <span>
              <span className="toggle-label">Automatisch verlengen</span>
              <span className="toggle-hint">
                Bij einddatum wordt het abonnement automatisch met 6 maanden
                verlengd.
              </span>
            </span>
          </label>
        </div>

        {form.formState.errors.root && (
          <p className="text-sm" style={{ color: 'var(--danger)', marginTop: 14 }}>
            {form.formState.errors.root.message}
          </p>
        )}

        <div
          className="flex-between"
          style={{ marginTop: 18, gap: 8 }}
        >
          {hasExisting ? (
            <button
              className="btn btn-danger"
              onClick={() => void onCancelSubscription()}
              type="button"
            >
              Beëindigen
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
              {form.formState.isSubmitting ? 'Bezig…' : submitLabel}
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  )
}
