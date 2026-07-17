'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { type FC } from 'react'
import { useForm } from 'react-hook-form'

import { useToastStore } from '@shared/store/toast'
import { cn } from '@shared/utils/cn'

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
      maxWidthClassName="max-w-2xl"
      onClose={onClose}
      title={hasExisting ? 'Abonnement beheren' : 'Nieuw abonnement'}
    >
      <form onSubmit={event => void form.handleSubmit(onSubmit)(event)}>
        {subscription ? (
          <p className="mb-4 text-sm text-foreground">
            Klant:{' '}
            <span className="font-semibold">
              {customers.find(
                customer => customer.userId === subscription.userId,
              )?.label ?? subscription.userId}
            </span>
          </p>
        ) : (
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
              {...form.register('userId')}
            >
              <option value="">Selecteer klant...</option>
              {customers.map(customer => (
                <option key={customer.userId} value={customer.userId}>
                  {customer.label}
                </option>
              ))}
            </select>
            {form.formState.errors.userId && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.userId.message}
              </p>
            )}
          </div>
        )}

        <h3 className="mb-2 text-sm font-semibold text-foreground">
          Abonnementstype
        </h3>
        <p className="mb-2 text-xs text-muted-foreground">
          Volledige abonnementen
        </p>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {PLANS.filter(plan => plan.category === 'full').map(plan => (
            <label
              className={cn(
                'cursor-pointer rounded-md border px-3 py-2.5 text-xs',
                form.watch('planId') === plan.id
                  ? 'border-primary bg-primary-soft'
                  : 'border-border bg-background',
              )}
              key={plan.id}
            >
              <input
                checked={form.watch('planId') === plan.id}
                className="sr-only"
                onChange={() => onSelectPlan(plan.id)}
                type="radio"
                value={plan.id}
              />
              <div className="font-semibold text-foreground">{plan.label}</div>
              <div className="text-muted-foreground">
                €{plan.price} per 6 maanden
              </div>
            </label>
          ))}
        </div>
        <p className="mb-2 text-xs text-muted-foreground">
          Alleen Waardebepaling
        </p>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {PLANS.filter(plan => plan.category === 'valuation').map(plan => (
            <label
              className={cn(
                'cursor-pointer rounded-md border px-3 py-2.5 text-xs',
                form.watch('planId') === plan.id
                  ? 'border-primary bg-primary-soft'
                  : 'border-border bg-background',
              )}
              key={plan.id}
            >
              <input
                checked={form.watch('planId') === plan.id}
                className="sr-only"
                onChange={() => onSelectPlan(plan.id)}
                type="radio"
                value={plan.id}
              />
              <div className="font-semibold text-foreground">{plan.label}</div>
              <div className="text-muted-foreground">€{plan.price}</div>
            </label>
          ))}
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label
              className={`
                mb-1.5 block text-[13px] font-medium text-foreground-secondary
              `}
            >
              Prijs per 6 maanden (€)
            </label>
            <input
              className={`
                w-full rounded-md border border-border bg-surface px-3.5 py-2.5
                text-sm
              `}
              type="number"
              {...form.register('price', { valueAsNumber: true })}
            />
            {form.formState.errors.price && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.price.message}
              </p>
            )}
          </div>
          <div>
            <label
              className={`
                mb-1.5 block text-[13px] font-medium text-foreground-secondary
              `}
            >
              Startdatum
            </label>
            <input
              className={`
                w-full rounded-md border border-border bg-surface px-3.5 py-2.5
                text-sm
              `}
              type="date"
              {...form.register('startDate')}
            />
          </div>
        </div>

        <div className="mb-4 grid grid-cols-[1fr_auto] items-end gap-3">
          <div>
            <label
              className={`
                mb-1.5 block text-[13px] font-medium text-foreground-secondary
              `}
            >
              Einddatum (looptijd standaard 6 maanden)
            </label>
            <input
              className={`
                w-full rounded-md border border-border bg-surface px-3.5 py-2.5
                text-sm
              `}
              type="date"
              {...form.register('endDate')}
            />
          </div>
          <button
            className={`
              rounded-md border border-border px-3 py-2.5 text-xs font-semibold
              text-foreground
              hover:bg-border-soft
            `}
            onClick={onSetEndDateFromStart}
            type="button"
          >
            + 6 maanden vanaf startdatum
          </button>
        </div>

        <label
          className={`
            mb-4 flex items-center justify-between rounded-md border
            border-border bg-background px-4 py-3
          `}
        >
          <span className="text-sm font-medium text-foreground">
            Automatisch verlengen
          </span>
          <input type="checkbox" {...form.register('autoRenew')} />
        </label>

        {form.formState.errors.root && (
          <p className="mb-4 text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          {hasExisting ? (
            <button
              className={`
                text-sm font-semibold text-destructive
                hover:underline
              `}
              onClick={() => void onCancelSubscription()}
              type="button"
            >
              Beëindigen
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
              {form.formState.isSubmitting ? 'Bezig…' : submitLabel}
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  )
}
