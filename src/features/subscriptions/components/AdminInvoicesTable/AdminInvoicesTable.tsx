'use client'

import {
  useMemo,
  useState,
  type ChangeEvent,
  type FC,
  type SVGProps,
} from 'react'

import { cn } from '@shared/utils/cn'

import { adminDeleteInvoice } from '../../actions'
import {
  ADMIN_FACTUREN_EXPORT_PATH,
  INVOICE_FILTER_PRESET_LABELS,
  INVOICE_FILTER_PRESET_OPTIONS,
} from '../../constants'
import { formatDateNl } from '../../lib/formatDateNl'
import { formatEuro } from '../../lib/formatEuro'
import {
  describeInvoiceFilter,
  filterInvoicesByDateRange,
} from '../../lib/invoiceFilter'
import { isOverdueInvoice } from '../../lib/lockStatus'
import { type InvoiceFilter, type InvoiceFilterPreset } from '../../types'
import { AdminInvoiceModal } from '../AdminInvoiceModal'
import { InvoiceStatusBadge } from '../InvoiceStatusBadge'
import { KpiTile } from '../KpiTile'
import { type Props } from './types'

const DownloadIcon: FC<SVGProps<SVGSVGElement>> = props => (
  <svg
    fill="none"
    height="14"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="14"
    {...props}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
)

const PlusIcon: FC<SVGProps<SVGSVGElement>> = props => (
  <svg
    fill="none"
    height="14"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="14"
    {...props}
  >
    <line x1="12" x2="12" y1="5" y2="19" />
    <line x1="5" x2="19" y1="12" y2="12" />
  </svg>
)

const FunnelIcon: FC<SVGProps<SVGSVGElement>> = props => (
  <svg
    fill="none"
    height="14"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="14"
    {...props}
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
)

const XIcon: FC<SVGProps<SVGSVGElement>> = props => (
  <svg
    fill="none"
    height="12"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="12"
    {...props}
  >
    <line x1="18" x2="6" y1="6" y2="18" />
    <line x1="6" x2="18" y1="6" y2="18" />
  </svg>
)

const SearchIcon: FC<SVGProps<SVGSVGElement>> = props => (
  <svg
    fill="none"
    height="14"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="14"
    {...props}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

const TrashIcon: FC<SVGProps<SVGSVGElement>> = props => (
  <svg
    fill="none"
    height="14"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="14"
    {...props}
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
)

const TH_CLASSES = `
  border-b border-border-soft bg-background px-4 py-3 text-[12px]
  font-semibold tracking-[0.04em] text-muted-foreground uppercase
`
const TD_CLASSES = 'border-b border-border-soft px-4 py-3 text-[13.5px]'

export const AdminInvoicesTable: FC<Props> = ({ customers, invoices }) => {
  const [filter, setFilter] = useState<InvoiceFilter>({
    from: null,
    preset: 'all',
    to: null,
  })
  const [searchText, setSearchText] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const dateFilteredInvoices = useMemo(
    () => filterInvoicesByDateRange(invoices, filter),
    [invoices, filter],
  )

  const kpis = useMemo(() => {
    let openAmount = 0
    let openCount = 0
    let overdueAmount = 0
    let overdueCount = 0
    let paidAmount = 0
    let paidCount = 0

    dateFilteredInvoices.forEach(invoice => {
      const gross = invoice.grossValue ?? 0

      if (invoice.isCreditNote || invoice.status === 'paid') {
        paidAmount += gross
        paidCount += 1
        return
      }

      if (invoice.status === 'issued') {
        if (isOverdueInvoice(invoice)) {
          overdueAmount += gross
          overdueCount += 1
        } else {
          openAmount += gross
          openCount += 1
        }
      }
    })

    return {
      openAmount,
      openCount,
      overdueAmount,
      overdueCount,
      paidAmount,
      paidCount,
    }
  }, [dateFilteredInvoices])

  const visibleInvoices = dateFilteredInvoices.filter(invoice => {
    const haystack = `
      ${invoice.number} ${invoice.recipientName ?? ''} ${invoice.recipientEmail} ${invoice.description}
    `.toLowerCase()

    return haystack.includes(searchText.trim().toLowerCase())
  })

  const onSelectPreset = (preset: InvoiceFilterPreset): void => {
    setFilter({ from: null, preset, to: null })
  }

  const onCustomFromChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setFilter(current => ({ ...current, from: event.target.value || null }))
  }

  const onCustomToChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setFilter(current => ({ ...current, to: event.target.value || null }))
  }

  const onDeleteInvoice = async (id: string): Promise<void> => {
    if (
      !window.confirm(
        'Weet je zeker dat je deze factuur wilt verwijderen? Alleen concept-facturen kunnen weg — Mollie staat verwijderen van verstuurde of betaalde facturen niet toe.',
      )
    ) {
      return
    }

    await adminDeleteInvoice(id)
  }

  const exportHref = `${ADMIN_FACTUREN_EXPORT_PATH}?preset=${filter.preset}${
    filter.from ? `&from=${filter.from}` : ''
  }${filter.to ? `&to=${filter.to}` : ''}`

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-6">
        <h1
          className={`
            font-serif text-[34px] leading-tight font-medium tracking-[-0.01em]
            text-foreground
          `}
        >
          Facturatie
        </h1>
        <div className="flex flex-wrap gap-2">
          <a
            className={`
              inline-flex items-center rounded-md border border-border
              bg-surface px-5 py-3 text-sm font-semibold text-foreground
              transition
              hover:border-foreground-secondary hover:bg-border-soft
            `}
            href={exportHref}
            title="Genereer Importbestand voor Exact — past de huidige filter toe"
          >
            <DownloadIcon className="mr-1 inline align-[-2px]" />
            Importbestand Exact
          </a>
          <button
            className={`
              inline-flex items-center rounded-md bg-primary px-5 py-3 text-sm
              font-semibold text-primary-foreground transition
              hover:bg-primary-hover
            `}
            onClick={() => setIsCreating(true)}
            type="button"
          >
            <PlusIcon className="mr-1 inline align-[-2px]" />
            Nieuwe factuur
          </button>
        </div>
      </div>

      <div
        className={`
          mb-4 rounded-lg border border-border bg-surface px-[18px] py-3.5
          shadow-sm
        `}
      >
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="flex shrink-0 items-center gap-2">
            <FunnelIcon className="text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Filter op factuurdatum
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {INVOICE_FILTER_PRESET_OPTIONS.map(preset => (
              <button
                className={cn(
                  `
                    rounded-full border px-3 py-1.5 text-[13px] font-medium
                    transition
                  `,
                  filter.preset === preset
                    ? 'border-foreground bg-foreground text-white'
                    : `
                      border-border bg-surface text-foreground-secondary
                      hover:border-foreground-secondary hover:bg-border-soft
                    `,
                )}
                key={preset}
                onClick={() => onSelectPreset(preset)}
                type="button"
              >
                {INVOICE_FILTER_PRESET_LABELS[preset]}
              </button>
            ))}
          </div>
          {filter.preset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                className={`
                  rounded-md border border-border bg-background px-2.5 py-1.5
                  text-[13px]
                `}
                onChange={onCustomFromChange}
                type="date"
                value={filter.from ?? ''}
              />
              <span className="text-sm text-muted-foreground">t/m</span>
              <input
                className={`
                  rounded-md border border-border bg-background px-2.5 py-1.5
                  text-[13px]
                `}
                onChange={onCustomToChange}
                type="date"
                value={filter.to ?? ''}
              />
            </div>
          )}
          <div className="flex-1" />
          {filter.preset !== 'all' && (
            <>
              <span className="text-xs whitespace-nowrap text-muted-foreground">
                {describeInvoiceFilter(filter)}
              </span>
              <button
                className={`
                  inline-flex items-center rounded-md px-2.5 py-1 text-[13px]
                  font-medium text-foreground-secondary transition
                  hover:bg-border-soft
                `}
                onClick={() => onSelectPreset('all')}
                title="Filter wissen"
                type="button"
              >
                <XIcon className="mr-[3px] inline align-[-2px]" />
                Wissen
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className={`
          mb-6 grid grid-cols-1 gap-5
          md:grid-cols-3
        `}
      >
        <KpiTile
          label="Openstaand"
          meta={`${kpis.openCount} ${kpis.openCount === 1 ? 'factuur' : 'facturen'}`}
          value={formatEuro(kpis.openAmount)}
        />
        <KpiTile
          label="Vervallen"
          meta={`${kpis.overdueCount} ${kpis.overdueCount === 1 ? 'factuur' : 'facturen'}`}
          value={formatEuro(kpis.overdueAmount)}
          valueClassName={kpis.overdueAmount > 0 ? 'text-[#B91C1C]' : undefined}
        />
        <KpiTile
          label="Betaald"
          meta={`${kpis.paidCount} ${kpis.paidCount === 1 ? 'factuur' : 'facturen'}`}
          value={formatEuro(kpis.paidAmount)}
        />
      </div>

      <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              className={`
                mb-1 font-serif text-xl font-medium tracking-[-0.01em]
                text-foreground
              `}
            >
              Facturenoverzicht
            </h2>
            <p className="text-[13.5px] text-muted-foreground">
              {filter.preset === 'all'
                ? 'Alle facturen van Osago, gesorteerd op datum.'
                : `Facturen in geselecteerde periode (${dateFilteredInvoices.length}).`}
            </p>
          </div>
          <div className="relative w-[280px] max-w-full">
            <SearchIcon
              className={`
                pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2
                text-muted-foreground
              `}
            />
            <input
              className={`
                w-full rounded-md border border-border bg-background py-2 pr-3
                pl-8 text-[13px]
                focus:border-primary focus:outline-none
              `}
              onChange={event => setSearchText(event.target.value)}
              placeholder="Zoek op nummer, klant of omschrijving..."
              type="text"
              value={searchText}
            />
          </div>
        </div>

        {visibleInvoices.length === 0 ? (
          <div
            className={`
              rounded-md border border-border bg-background px-6 py-10
              text-center
            `}
          >
            <h3 className="mb-1 text-sm font-semibold text-foreground">
              {invoices.length === 0
                ? 'Nog geen facturen'
                : 'Geen facturen in deze periode'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {invoices.length === 0
                ? 'Klik op "Nieuwe factuur" om de eerste factuur aan te maken.'
                : 'Pas het filter aan, of voeg een nieuwe factuur toe.'}
            </p>
          </div>
        ) : (
          <div className="-mx-6 -mb-6 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className={cn(TH_CLASSES, 'pl-6')}>Factuurnr.</th>
                  <th className={TH_CLASSES}>Klant</th>
                  <th className={TH_CLASSES}>Datum</th>
                  <th className={TH_CLASSES}>Vervaldatum</th>
                  <th className={TH_CLASSES}>Omschrijving</th>
                  <th className={cn(TH_CLASSES, 'text-right')}>Bedrag</th>
                  <th className={TH_CLASSES}>Status</th>
                  <th className={cn(TH_CLASSES, 'pr-6')} />
                </tr>
              </thead>
              <tbody>
                {visibleInvoices.map(invoice => (
                  <tr className="hover:bg-[#E9EDEB]" key={invoice.id}>
                    <td
                      className={cn(
                        TD_CLASSES,
                        `pl-6 font-medium text-foreground`,
                      )}
                    >
                      <strong className="font-semibold">
                        {invoice.number}
                      </strong>
                    </td>
                    <td className={TD_CLASSES}>
                      <div className="font-semibold text-foreground">
                        {invoice.recipientName ?? 'Onbekende ontvanger'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {invoice.recipientEmail}
                      </div>
                    </td>
                    <td className={cn(TD_CLASSES, 'text-muted-foreground')}>
                      {invoice.issuedAt || invoice.createdAt
                        ? formatDateNl(
                            (invoice.issuedAt ?? invoice.createdAt) as string,
                          )
                        : '—'}
                    </td>
                    <td className={cn(TD_CLASSES, 'text-muted-foreground')}>
                      {invoice.dueAt ? formatDateNl(invoice.dueAt) : '—'}
                    </td>
                    <td
                      className={cn(
                        TD_CLASSES,
                        'max-w-[280px] text-muted-foreground',
                      )}
                    >
                      {invoice.description || invoice.period}
                    </td>
                    <td
                      className={cn(
                        TD_CLASSES,
                        'text-right font-medium text-foreground',
                      )}
                    >
                      <strong className="font-semibold">
                        {invoice.grossValue !== null
                          ? formatEuro(invoice.grossValue)
                          : '—'}
                      </strong>
                    </td>
                    <td className={TD_CLASSES}>
                      <InvoiceStatusBadge invoice={invoice} />
                    </td>
                    <td
                      className={cn(
                        TD_CLASSES,
                        'pr-6 text-right whitespace-nowrap',
                      )}
                    >
                      {invoice.status === 'draft' && (
                        <button
                          aria-label="Verwijderen"
                          className={`
                            inline-flex items-center justify-center rounded-md
                            px-2 py-1.5 text-destructive transition
                            hover:bg-border-soft
                          `}
                          onClick={() => void onDeleteInvoice(invoice.id)}
                          title="Verwijderen"
                          type="button"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isCreating && (
        <AdminInvoiceModal
          customers={customers}
          onClose={() => setIsCreating(false)}
        />
      )}
    </div>
  )
}
