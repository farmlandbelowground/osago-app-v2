'use client'

import { useState, type FC } from 'react'

import { useAdminAvailabilityStore } from '@features/auth/store'
import { APPT_DEFAULT_AVAILABILITY } from '@shared/constants/availability'
import { useToastStore } from '@shared/store/toast'

import { changeStaffRole } from '../../actions'
import { type StaffMember, type StaffMemberFormData } from '../../types'
import { TeamMemberCard } from '../TeamMemberCard'
import { TeamMemberModal } from '../TeamMemberModal'
import { TeamScheduleModal } from '../TeamScheduleModal'
import { type Props } from './types'

type ModalState =
  | { member: StaffMember; type: 'edit' | 'schedule' }
  | { type: 'add' }
  | null

// Client orchestrator: only a role change on an existing member persists (via
// changeStaffRole). Create / deactivate / edit-name / remove are session-only
// local state — legacy kept db.admins in localStorage and never synced them;
// v2 has no admin-create-Auth-user endpoint (D-B). The rooster lives in the
// (localStorage) admin-availability store, exactly as legacy (D-H).
export const TeamGrid: FC<Props> = ({ currentUserId, staff }) => {
  const showToast = useToastStore(state => state.showToast)
  const availabilityByAdminId = useAdminAvailabilityStore(
    state => state.availabilityByAdminId,
  )
  const [members, setMembers] = useState<StaffMember[]>(staff)
  const [modal, setModal] = useState<ModalState>(null)

  // No v2 sentinel for legacy's 'a1' hoofd-admin; the earliest-created admin
  // acts as it (protected from role change / deactivate / delete).
  const hoofdAdminId = staff.find(member => member.role === 'admin')?.id ?? null

  const onAddSave = (data: StaffMemberFormData): void => {
    setMembers(current => [
      ...current,
      { ...data, createdAt: null, id: crypto.randomUUID() },
    ])
    setModal(null)
    showToast('Medewerker toegevoegd.')
  }

  const onEditSave = async (
    target: StaffMember,
    data: StaffMemberFormData,
  ): Promise<void> => {
    setMembers(current =>
      current.map(member =>
        member.id === target.id ? { ...member, ...data } : member,
      ),
    )
    setModal(null)

    const isRealProfile = staff.some(member => member.id === target.id)
    const isRoleChanged = data.role !== target.role
    const isProtected =
      target.id === currentUserId || target.id === hoofdAdminId

    if (isRealProfile && isRoleChanged && !isProtected) {
      const result = await changeStaffRole(target.id, data.role)
      if (result.error) {
        showToast(result.error, 'error')
        return
      }
    }

    showToast('Medewerker bijgewerkt.')
  }

  const onToggleActive = (member: StaffMember): void => {
    setMembers(current =>
      current.map(item =>
        item.id === member.id ? { ...item, active: !item.active } : item,
      ),
    )
    showToast(
      member.active ? 'Medewerker gedeactiveerd.' : 'Medewerker geactiveerd.',
    )
  }

  const onRemove = (member: StaffMember): void => {
    if (
      !window.confirm('Weet je zeker dat je deze medewerker wilt verwijderen?')
    ) {
      return
    }
    setMembers(current => current.filter(item => item.id !== member.id))
    showToast('Medewerker verwijderd.')
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
        {members.map(member => (
          <TeamMemberCard
            availability={
              availabilityByAdminId[member.id] ?? APPT_DEFAULT_AVAILABILITY
            }
            isHoofdAdmin={member.id === hoofdAdminId}
            isSelf={member.id === currentUserId}
            key={member.id}
            linkedTypesCount={0}
            member={member}
            onEdit={() => setModal({ member, type: 'edit' })}
            onRemove={() => onRemove(member)}
            onSchedule={() => setModal({ member, type: 'schedule' })}
            onToggleActive={() => onToggleActive(member)}
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
          onSave={onAddSave}
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
          memberName={`${modal.member.firstName} ${modal.member.lastName}`}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
