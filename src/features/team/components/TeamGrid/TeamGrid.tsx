'use client'

import { useRouter } from 'next/navigation'
import { useState, type FC } from 'react'

import { APPT_DEFAULT_AVAILABILITY } from '@shared/constants/availability'
import { useToastStore } from '@shared/store/toast'

import {
  createStaff,
  removeStaff,
  setStaffActive,
  updateStaff,
} from '../../actions'
import { type StaffMember, type StaffMemberFormData } from '../../types'
import { TeamMemberCard } from '../TeamMemberCard'
import { TeamMemberModal } from '../TeamMemberModal'
import { TeamScheduleModal } from '../TeamScheduleModal'
import { type Props } from './types'

type ModalState =
  { member: StaffMember; type: 'edit' | 'schedule' } | { type: 'add' } | null

// Client orchestrator over the persisting staff server actions (createStaff,
// updateStaff, setStaffActive, removeStaff, setStaffAvailability). After each
// mutation the action revalidates the medewerker route and the grid calls
// router.refresh() to pull the fresh server data. Self / hoofd-admin protection
// is enforced server-side; the client checks here are advisory (they hide the
// controls, but the action re-checks).
export const TeamGrid: FC<Props> = ({ currentUserId, staff }) => {
  const router = useRouter()
  const showToast = useToastStore(state => state.showToast)
  const [modal, setModal] = useState<ModalState>(null)

  // No v2 sentinel for legacy's 'a1' hoofd-admin; the earliest-created admin
  // acts as it (protected from role change / deactivate / delete). staff is
  // ordered created_at ascending, so the first admin is the earliest.
  const hoofdAdminId = staff.find(member => member.role === 'admin')?.id ?? null

  const onAddSave = async (data: StaffMemberFormData): Promise<void> => {
    const result = await createStaff(data)
    if (result.error) {
      showToast(result.error, 'error')
      return
    }
    setModal(null)
    showToast('Medewerker toegevoegd.')
    router.refresh()
  }

  const onEditSave = async (
    target: StaffMember,
    data: StaffMemberFormData,
  ): Promise<void> => {
    const result = await updateStaff(target.id, data)
    if (result.error) {
      showToast(result.error, 'error')
      return
    }
    setModal(null)
    showToast('Medewerker bijgewerkt.')
    router.refresh()
  }

  const onToggleActive = async (member: StaffMember): Promise<void> => {
    const result = await setStaffActive(member.id, !member.active)
    if (result.error) {
      showToast(result.error, 'error')
      return
    }
    showToast(
      member.active ? 'Medewerker gedeactiveerd.' : 'Medewerker geactiveerd.',
    )
    router.refresh()
  }

  const onRemove = async (member: StaffMember): Promise<void> => {
    if (
      !window.confirm('Weet je zeker dat je deze medewerker wilt verwijderen?')
    ) {
      return
    }
    const result = await removeStaff(member.id)
    if (result.error) {
      showToast(result.error, 'error')
      return
    }
    showToast('Medewerker verwijderd.')
    router.refresh()
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Medewerkers</h1>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={() => setModal({ type: 'add' })}
            type="button"
          >
            + Medewerker toevoegen
          </button>
        </div>
      </div>

      <div className="grid-2 grid" style={{ gap: 16 }}>
        {staff.map(member => (
          <TeamMemberCard
            availability={member.availability ?? APPT_DEFAULT_AVAILABILITY}
            isHoofdAdmin={member.id === hoofdAdminId}
            isSelf={member.id === currentUserId}
            key={member.id}
            linkedTypesCount={0}
            member={member}
            onEdit={() => setModal({ member, type: 'edit' })}
            onRemove={() => void onRemove(member)}
            onSchedule={() => setModal({ member, type: 'schedule' })}
            onToggleActive={() => void onToggleActive(member)}
          />
        ))}
      </div>

      <div className="alert alert-info mt-5">
        <strong>Rollen:</strong> <strong>Admin</strong>-medewerkers hebben
        volledige toegang tot het beheerpaneel inclusief Vouchers en
        Medewerkers. <strong>User</strong>-medewerkers hebben toegang tot alle
        operationele onderdelen (klanten, projecten, facturatie, abonnementen)
        maar geen toegang tot Vouchers en Medewerkers. <strong>Rooster</strong>{' '}
        bepaalt wanneer een medewerker via de afspraken-boekingslink kan worden
        gepland — afspraaktypen tonen alleen vrije slots binnen het rooster van
        de gekoppelde medewerker(s).
      </div>

      {modal?.type === 'add' && (
        <TeamMemberModal
          isHoofdAdmin={false}
          isSelf={false}
          onClose={() => setModal(null)}
          onSave={data => void onAddSave(data)}
        />
      )}
      {modal?.type === 'edit' && (
        <TeamMemberModal
          isHoofdAdmin={modal.member.id === hoofdAdminId}
          isSelf={modal.member.id === currentUserId}
          member={modal.member}
          onClose={() => setModal(null)}
          onSave={data => void onEditSave(modal.member, data)}
        />
      )}
      {modal?.type === 'schedule' && (
        <TeamScheduleModal
          adminId={modal.member.id}
          availability={modal.member.availability}
          memberName={`${modal.member.firstName} ${modal.member.lastName}`}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
