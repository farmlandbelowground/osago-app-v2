'use client'

import { useRouter } from 'next/navigation'
import { useState, type FC } from 'react'

import { ModalShell } from '@shared/components/ModalShell'
import { useToastStore } from '@shared/store/toast'

import { addBuyerForCustomer } from '../../actions'
import { SOURCE_OPTIONS } from '../../constants'
import { type Props } from './types'

export const AddBuyerModal: FC<Props> = ({
  customerName,
  onClose,
  targetUserId,
}) => {
  const router = useRouter()
  const showToast = useToastStore(state => state.showToast)
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [contactFirstName, setContactFirstName] = useState('')
  const [contactLastName, setContactLastName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [source, setSource] = useState('')
  const [isPending, setIsPending] = useState(false)

  const onSubmit = async (): Promise<void> => {
    if (!name.trim()) {
      showToast('Naam van de koper is verplicht.', 'error')
      return
    }

    setIsPending(true)
    const result = await addBuyerForCustomer({
      contactEmail,
      contactFirstName,
      contactLastName,
      contactPhone,
      name,
      source,
      targetUserId,
      type,
    })
    setIsPending(false)

    if (result.error) {
      showToast(result.error, 'error')
      return
    }

    showToast('Koper toegevoegd.')
    onClose()
    router.refresh()
  }

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={onClose} type="button">
        Annuleren
      </button>
      <button
        className="btn btn-primary"
        disabled={isPending}
        onClick={() => void onSubmit()}
        type="button"
      >
        Koper toevoegen
      </button>
    </>
  )

  return (
    <ModalShell
      footer={footer}
      onClose={onClose}
      title="Koper toevoegen namens klant"
    >
      <div className="alert alert-info mb-4">
        <strong>Toevoegen namens klant.</strong> Deze lead krijgt automatisch het
        label <em>Gevalideerd door Osago</em> en verschijnt onder{' '}
        <em>Kopermatching → Gevalideerde leads door Osago</em> in het account van{' '}
        <strong>{customerName}</strong>.
      </div>
      <div className="field">
        <label>Naam koper</label>
        <input onChange={event => setName(event.target.value)} type="text" value={name} />
      </div>
      <div className="field">
        <label>Type</label>
        <input onChange={event => setType(event.target.value)} type="text" value={type} />
      </div>
      <div className="form-row">
        <div className="field">
          <label>Contact voornaam</label>
          <input
            onChange={event => setContactFirstName(event.target.value)}
            type="text"
            value={contactFirstName}
          />
        </div>
        <div className="field">
          <label>Contact achternaam</label>
          <input
            onChange={event => setContactLastName(event.target.value)}
            type="text"
            value={contactLastName}
          />
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label>Contact e-mail</label>
          <input
            onChange={event => setContactEmail(event.target.value)}
            type="email"
            value={contactEmail}
          />
        </div>
        <div className="field">
          <label>Contact telefoon</label>
          <input
            onChange={event => setContactPhone(event.target.value)}
            type="tel"
            value={contactPhone}
          />
        </div>
      </div>
      <div className="field">
        <label>
          Source{' '}
          <span className="text-xs text-muted" style={{ fontWeight: 400 }}>
            (intern, niet zichtbaar voor klant)
          </span>
        </label>
        <select onChange={event => setSource(event.target.value)} value={source}>
          <option value="">— Geen / onbekend —</option>
          {SOURCE_OPTIONS.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </ModalShell>
  )
}
