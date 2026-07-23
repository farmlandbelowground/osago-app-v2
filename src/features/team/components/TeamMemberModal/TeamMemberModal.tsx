'use client'

import { useState, type ChangeEvent, type FC } from 'react'

import { PasswordChecklist } from '@features/auth/components/PasswordChecklist'
import { formatFileSize } from '@features/documents/lib/formatFileSize'
import { ModalShell } from '@shared/components/ModalShell'
import { useToastStore } from '@shared/store/toast'

import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_POLICY_TEXT,
  PHOTO_MAX_SIZE_BYTES,
  STAFF_ROLE_LABELS,
} from '../../constants'
import { generatePassword } from '../../lib/generatePassword'
import { type StaffRole } from '../../types'
import { type Props } from './types'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const TeamMemberModal: FC<Props> = ({
  isHoofdAdmin,
  isSelf,
  member,
  onClose,
  onSave,
}) => {
  const showToast = useToastStore(state => state.showToast)
  const isEdit = Boolean(member)
  // Own role / hoofd-admin role can be neither re-assigned nor deactivated.
  const roleEditable = !isSelf && !isHoofdAdmin
  const activeEditable = !isSelf && !isHoofdAdmin
  const [firstName, setFirstName] = useState(member?.firstName ?? '')
  const [lastName, setLastName] = useState(member?.lastName ?? '')
  const [email, setEmail] = useState(member?.email ?? '')
  const [phone, setPhone] = useState(member?.phone ?? '')
  const [role, setRole] = useState<StaffRole>(member?.role ?? 'user')
  const [active, setActive] = useState(member?.active ?? true)
  const [photo, setPhoto] = useState<string | null>(member?.photo ?? null)
  const [password, setPassword] = useState('')

  const initials =
    `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '—'

  const onPhotoChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    if (!file.type.startsWith('image/')) {
      showToast('Selecteer een afbeelding.', 'error')
      event.target.value = ''
      return
    }
    if (file.size > PHOTO_MAX_SIZE_BYTES) {
      showToast(
        `Afbeelding is te groot (max ${formatFileSize(PHOTO_MAX_SIZE_BYTES)}).`,
        'error',
      )
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setPhoto(typeof reader.result === 'string' ? reader.result : null)
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = (): void => {
    if (!firstName.trim() || !lastName.trim()) {
      showToast('Voor- en achternaam zijn verplicht.', 'error')
      return
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      showToast('Vul een geldig e-mailadres in.', 'error')
      return
    }

    onSave({
      active,
      email: email.trim().toLowerCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      password,
      phone: phone.trim(),
      photo,
      role,
    })
  }

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={onClose} type="button">
        Annuleren
      </button>
      <button className="btn btn-primary" onClick={onSubmit} type="button">
        {isEdit ? 'Opslaan' : 'Toevoegen'}
      </button>
    </>
  )

  const photoField = (
    <div className="field">
      <label>
        Profielfoto{' '}
        <span className="text-xs text-muted">
          (optioneel, max {formatFileSize(PHOTO_MAX_SIZE_BYTES)})
        </span>
      </label>
      <div className="photo-upload-row">
        <div className="photo-upload-preview">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- base64 data-URI preview
            <img alt="Profielfoto" src={photo} />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="photo-upload-actions">
          <input accept="image/*" onChange={onPhotoChange} type="file" />
          {photo && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setPhoto(null)}
              style={{ alignSelf: 'flex-start' }}
              type="button"
            >
              Foto verwijderen
            </button>
          )}
        </div>
      </div>
    </div>
  )

  const roleField = (
    <div className="field">
      <label>Rol</label>
      {roleEditable ? (
        <select
          onChange={event => setRole(event.target.value as StaffRole)}
          value={role}
        >
          <option value="user">
            User — toegang tot operationele onderdelen, geen
            Vouchers/Medewerkers
          </option>
          <option value="admin">
            Admin — volledige toegang tot het beheerpaneel
          </option>
        </select>
      ) : (
        <>
          <input
            disabled
            style={{
              background: 'var(--line-soft)',
              color: 'var(--muted)',
              cursor: 'not-allowed',
            }}
            type="text"
            value={STAFF_ROLE_LABELS[role]}
          />
          <span
            className="text-xs text-muted"
            style={{ display: 'block', marginTop: 4 }}
          >
            {isSelf
              ? 'Je kunt jouw eigen rol niet wijzigen.'
              : 'De rol van de hoofd-admin kan niet gewijzigd worden.'}
          </span>
        </>
      )}
    </div>
  )

  return (
    <ModalShell
      footer={footer}
      onClose={onClose}
      title={isEdit ? 'Medewerker bewerken' : 'Medewerker toevoegen'}
    >
      <div className="form-row">
        <div className="field">
          <label>Voornaam</label>
          <input
            onChange={event => setFirstName(event.target.value)}
            type="text"
            value={firstName}
          />
        </div>
        <div className="field">
          <label>Achternaam</label>
          <input
            onChange={event => setLastName(event.target.value)}
            type="text"
            value={lastName}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label>E-mailadres</label>
          <input
            onChange={event => setEmail(event.target.value)}
            placeholder={isEdit ? undefined : 'naam@osago.nl'}
            type="email"
            value={email}
          />
        </div>
        <div className="field">
          <label>Telefoonnummer</label>
          <input
            onChange={event => setPhone(event.target.value)}
            placeholder="+31 6 12345678"
            type="tel"
            value={phone}
          />
        </div>
      </div>

      {!isEdit && (
        <div className="field">
          <label>Wachtwoord</label>
          <div style={{ alignItems: 'stretch', display: 'flex', gap: 8 }}>
            <input
              autoComplete="new-password"
              onChange={event => setPassword(event.target.value)}
              placeholder={PASSWORD_POLICY_TEXT}
              style={{ flex: 1 }}
              type="password"
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
            {PASSWORD_POLICY_TEXT} De medewerker kan dit later zelf wijzigen via
            Mijn account.
          </span>
        </div>
      )}

      {photoField}
      {roleField}

      {isEdit && (
        <div className="field">
          <label>Status</label>
          {activeEditable ? (
            <label
              style={{
                alignItems: 'center',
                background: 'var(--line-soft)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                gap: 10,
                padding: '10px 12px',
              }}
            >
              <input
                checked={active}
                onChange={event => setActive(event.target.checked)}
                style={{ accentColor: 'var(--green)', cursor: 'pointer' }}
                type="checkbox"
              />
              <span>
                <span style={{ display: 'block', fontWeight: 600 }}>
                  Medewerker is actief
                </span>
                <span className="text-xs text-muted">
                  Inactieve medewerkers kunnen niet inloggen, maar blijven
                  zichtbaar voor historische koppelingen (klant-toewijzingen,
                  afspraaktypen).
                </span>
              </span>
            </label>
          ) : (
            <>
              <input
                disabled
                style={{
                  background: 'var(--line-soft)',
                  color: 'var(--muted)',
                  cursor: 'not-allowed',
                }}
                type="text"
                value={active ? 'Actief' : 'Niet actief'}
              />
              <span
                className="text-xs text-muted"
                style={{ display: 'block', marginTop: 4 }}
              >
                {isSelf
                  ? 'Je kunt jouw eigen account niet deactiveren.'
                  : 'De hoofd-admin kan niet gedeactiveerd worden.'}
              </span>
            </>
          )}
        </div>
      )}

      {isEdit && (
        <div className="field">
          <label>
            Nieuw wachtwoord{' '}
            <span className="text-xs text-muted">
              (laat leeg om niet te wijzigen)
            </span>
          </label>
          <input
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            onChange={event => setPassword(event.target.value)}
            placeholder="Minimaal 9 tekens"
            type="password"
            value={password}
          />
          {password && <PasswordChecklist password={password} />}
        </div>
      )}
    </ModalShell>
  )
}
