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
      <div className="page-header">
        <div>
          <h1 className="page-title">Facturatie</h1>
        </div>
        <div className="page-actions" style={{ gap: 8, flexWrap: 'wrap' }}>
          <a
            className="btn btn-secondary"
            href={exportHref}
            title="Genereer Importbestand voor Exact — past de huidige filter toe"
          >
            <DownloadIcon style={{ verticalAlign: -2, marginRight: 4 }} />
            Importbestand Exact
          </a>
          <button
            className="btn btn-primary"
            onClick={() => setIsCreating(true)}
            type="button"
          >
            <PlusIcon style={{ verticalAlign: -2, marginRight: 4 }} />
            Nieuwe factuur
          </button>
        </div>
      </div>

      <div className="card mb-4" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <FunnelIcon style={{ color: 'var(--muted)' }} />
            <span className="text-sm fw-600">Filter op factuurdatum</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {INVOICE_FILTER_PRESET_OPTIONS.map(preset => (
              <button
                className={cn('filter-chip', filter.preset === preset && `
                  active
                `)}
                key={preset}
                onClick={() => onSelectPreset(preset)}
                type="button"
              >
                {INVOICE_FILTER_PRESET_LABELS[preset]}
              </button>
            ))}
          </div>
          {filter.preset === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <input
                onChange={onCustomFromChange}
                style={{ padding: '6px 10px', fontSize: 13, width: 'auto' }}
                type="date"
                value={filter.from ?? ''}
              />
              <span className="text-muted text-sm">t/m</span>
              <input
                onChange={onCustomToChange}
                style={{ padding: '6px 10px', fontSize: 13, width: 'auto' }}
                type="date"
                value={filter.to ?? ''}
              />
            </div>
          )}
          <div style={{ flex: 1 }} />
          {filter.preset !== 'all' && (
            <>
              <span className="text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>
                {describeInvoiceFilter(filter)}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => onSelectPreset('all')}
                style={{ padding: '4px 10px' }}
                title="Filter wissen"
                type="button"
              >
                <XIcon style={{ verticalAlign: -2, marginRight: 3 }} />
                Wissen
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid-3 mb-5 grid">
        <KpiTile
          label="Openstaand"
          meta={`${kpis.openCount} ${kpis.openCount === 1 ? 'factuur' : 'facturen'}`}
          value={formatEuro(kpis.openAmount)}
        />
        <KpiTile
          label="Vervallen"
          meta={`${kpis.overdueCount} ${kpis.overdueCount === 1 ? 'factuur' : 'facturen'}`}
          value={formatEuro(kpis.overdueAmount)}
          valueStyle={kpis.overdueAmount > 0 ? { color: '#B91C1C' } : undefined}
        />
        <KpiTile
          label="Betaald"
          meta={`${kpis.paidCount} ${kpis.paidCount === 1 ? 'factuur' : 'facturen'}`}
          value={formatEuro(kpis.paidAmount)}
        />
      </div>

      <div className="card">
        <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3>Facturenoverzicht</h3>
            <p className="desc" style={{ marginBottom: 0 }}>
              {filter.preset === 'all'
                ? 'Alle facturen van Osago, gesorteerd op datum.'
                : `Facturen in geselecteerde periode (${dateFilteredInvoices.length}).`}
            </p>
          </div>
          <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
            <SearchIcon
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              onChange={event => setSearchText(event.target.value)}
              placeholder="Zoek op nummer, klant of omschrijving..."
              style={{ width: '100%', padding: '8px 12px 8px 32px', fontSize: 13 }}
              type="text"
              value={searchText}
            />
          </div>
        </div>

        {visibleInvoices.length === 0 ? (
          <div className="empty" style={{ padding: '36px 20px' }}>
            <h3>
              {invoices.length === 0
                ? 'Nog geen facturen'
                : 'Geen facturen in deze periode'}
            </h3>
            <p>
              {invoices.length === 0
                ? 'Klik op "Nieuwe factuur" om de eerste factuur aan te maken.'
                : 'Pas het filter aan, of voeg een nieuwe factuur toe.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', margin: '0 -24px -24px' }}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 24 }}>Factuurnr.</th>
                  <th>Klant</th>
                  <th>Datum</th>
                  <th>Vervaldatum</th>
                  <th>Omschrijving</th>
                  <th className="right">Bedrag</th>
                  <th>Status</th>
                  <th className="right" style={{ paddingRight: 24 }} />
                </tr>
              </thead>
              <tbody>
                {visibleInvoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td style={{ paddingLeft: 24 }}>
                      <strong>{invoice.number}</strong>
                    </td>
                    <td>
                      <strong>
                        {invoice.recipientName ?? 'Onbekende ontvanger'}
                      </strong>
                      <div className="text-xs text-muted">
                        {invoice.recipientEmail}
                      </div>
                    </td>
                    <td className="text-muted">
                      {invoice.issuedAt || invoice.createdAt
                        ? formatDateNl(
                            (invoice.issuedAt ?? invoice.createdAt) as string,
                          )
                        : '—'}
                    </td>
                    <td className="text-muted">
                      {invoice.dueAt ? formatDateNl(invoice.dueAt) : '—'}
                    </td>
                    <td style={{ maxWidth: 280 }}>
                      {invoice.description || invoice.period}
                    </td>
                    <td className="right">
                      <strong>
                        {invoice.grossValue !== null
                          ? formatEuro(invoice.grossValue)
                          : '—'}
                      </strong>
                    </td>
                    <td>
                      <InvoiceStatusBadge invoice={invoice} />
                    </td>
                    <td
                      className="right"
                      style={{ paddingRight: 24, whiteSpace: 'nowrap' }}
                    >
                      {invoice.status === 'draft' && (
                        <button
                          aria-label="Verwijderen"
                          className="btn btn-ghost btn-sm"
                          onClick={() => void onDeleteInvoice(invoice.id)}
                          style={{ padding: '6px 8px' }}
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
