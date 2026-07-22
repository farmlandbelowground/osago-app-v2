'use client'

import { useState, useTransition, type FC } from 'react'

import { useToastStore } from '@shared/store/toast'

import { sendValidationUpdate } from '../../actions'
import { LeadModalShell } from '../LeadModalShell'
import { type Props } from './types'

export const ValidationUpdateModal: FC<Props> = ({ lead, onClose }) => {
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const showToast = useToastStore(state => state.showToast)

  const onSend = (): void => {
    startTransition(async () => {
      const result = await sendValidationUpdate(lead.id, text)
      if (result.error !== null) {
        showToast(result.error, 'error')
        return
      }
      showToast('Validatie-update verstuurd naar de klant.')
      onClose()
    })
  }

  return (
    <LeadModalShell
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Annuleren
          </button>
          <button
            className="btn btn-primary"
            disabled={isPending}
            onClick={onSend}
            type="button"
          >
            {isPending ? 'Bezig...' : 'Versturen'}
          </button>
        </>
      }
      onClose={onClose}
      title="Validatie-update sturen"
    >
      <p className="desc" style={{ marginBottom: 12 }}>
        Deze update wordt namens Osago naar de klant (verkoper) gestuurd.
      </p>
      <div className="field">
        <label>Update voor de klant</label>
        <textarea
          onChange={event => setText(event.target.value)}
          placeholder="Bijv. resultaat van het gesprek, vervolgstappen, verwachte timing..."
          rows={6}
          value={text}
        />
      </div>
    </LeadModalShell>
  )
}
