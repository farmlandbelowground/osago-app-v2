'use client'

import { useRouter } from 'next/navigation'
import { useState, type FC } from 'react'

import { PasswordChecklist } from '@features/auth/components/PasswordChecklist'
import { ModalShell } from '@shared/components/ModalShell'
import { useToastStore } from '@shared/store/toast'

import { createCustomer } from '../../actions'
import { type Props } from './types'

const GENERATED_PASSWORD_LENGTH = 14
const PASSWORD_CHARSET =
  'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*?'
const PASSWORD_POLICY_TEXT =
  'Minimaal 9 tekens, met ten minste 1 letter, 1 cijfer en 1 symbool (bv. ! @ # $ %).'

const generatePassword = (): string => {
  const values = new Uint32Array(GENERATED_PASSWORD_LENGTH)
  crypto.getRandomValues(values)

  return Array.from(
    values,
    value => PASSWORD_CHARSET[value % PASSWORD_CHARSET.length],
  ).join('')
}

export const AdminNewCustomerModal: FC<Props> = ({ onClose }) => {
  const router = useRouter()
  const showToast = useToastStore(state => state.showToast)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [isPending, setIsPending] = useState(false)

  const onSubmit = async (): Promise<void> => {
    setIsPending(true)
    const result = await createCustomer({
      email,
      firstName,
      lastName,
      password,
      phone,
    })
    setIsPending(false)

    if (result.error) {
      showToast(result.error, 'error')
      return
    }

    showToast(`Klant ${firstName} ${lastName} toegevoegd.`)
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
        {isPending ? 'Klant aanmaken…' : 'Klant toevoegen'}
      </button>
    </>
  )

  return (
    <ModalShell footer={footer} onClose={onClose} title="Nieuwe klant">
      <div className="form-row">
        <div className="field">
          <label>Voornaam *</label>
          <input
            onChange={event => setFirstName(event.target.value)}
            type="text"
            value={firstName}
          />
        </div>
        <div className="field">
          <label>Achternaam *</label>
          <input
            onChange={event => setLastName(event.target.value)}
            type="text"
            value={lastName}
          />
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label>E-mailadres *</label>
          <input
            onChange={event => setEmail(event.target.value)}
            type="email"
            value={email}
          />
        </div>
        <div className="field">
          <label>Telefoonnummer *</label>
          <input
            onChange={event => setPhone(event.target.value)}
            placeholder="+31 6 1234 5678"
            type="tel"
            value={phone}
          />
        </div>
      </div>
      <div className="field">
        <label>Tijdelijk wachtwoord *</label>
        <div style={{ alignItems: 'stretch', display: 'flex', gap: 8 }}>
          <input
            onChange={event => setPassword(event.target.value)}
            placeholder={PASSWORD_POLICY_TEXT}
            style={{ flex: 1 }}
            type="text"
            value={password}
          />
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPassword(generatePassword())}
            title="Genereer een willekeurig wachtwoord dat voldoet aan de eisen."
            type="button"
          >
            Genereer
          </button>
        </div>
        <PasswordChecklist password={password} />
        <span
          className="text-xs text-muted"
          style={{ display: 'block', marginTop: 4 }}
        >
          {PASSWORD_POLICY_TEXT} De klant kan dit later zelf wijzigen via Mijn
          account.
        </span>
      </div>
    </ModalShell>
  )
}
