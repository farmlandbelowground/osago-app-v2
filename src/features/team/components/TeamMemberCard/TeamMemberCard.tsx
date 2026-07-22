'use client'

import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import {
  INACTIVE_CARD_OPACITY,
  ROOSTER_PREVIEW_DAYS,
  STAFF_ROLE_LABELS,
} from '../../constants'
import { type Props } from './types'

export const TeamMemberCard: FC<Props> = ({
  availability,
  isHoofdAdmin,
  isSelf,
  linkedTypesCount,
  member,
  onEdit,
  onRemove,
  onSchedule,
  onToggleActive,
}) => {
  const initials = `${member.firstName[0] ?? '?'}${
    member.lastName[0] ?? '?'
  }`.toUpperCase()
  const canManage = !isSelf && !isHoofdAdmin

  return (
    <div
      className="card"
      style={{ opacity: member.active ? 1 : INACTIVE_CARD_OPACITY }}
    >
      <div
        style={{
          alignItems: 'flex-start',
          display: 'flex',
          gap: 14,
          marginBottom: 14,
        }}
      >
        <div className="team-avatar">
          {member.photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- base64/url avatar
            <img
              alt="Profielfoto"
              src={member.photo}
              style={{ height: '100%', objectFit: 'cover', width: '100%' }}
            />
          ) : (
            initials
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <strong style={{ fontSize: 15 }}>
              {member.firstName} {member.lastName}
            </strong>
            <span
              className={cn(
                'badge',
                member.role === 'admin' ? 'badge-purple' : 'badge-gray',
              )}
            >
              {STAFF_ROLE_LABELS[member.role]}
            </span>
            <span
              className={cn('badge', member.active ? 'badge-green' : 'badge-red')}
            >
              {member.active ? 'Actief' : 'Niet actief'}
            </span>
            {isSelf && <span className="text-xs text-muted">(jij)</span>}
          </div>
          <div className="text-sm text-muted">{member.email}</div>
          {member.phone && (
            <div className="text-xs text-muted" style={{ marginTop: 2 }}>
              {member.phone}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div
          className="text-xs text-muted fw-600"
          style={{
            letterSpacing: '0.05em',
            marginBottom: 6,
            textTransform: 'uppercase',
          }}
        >
          Rooster
        </div>
        <div
          style={{
            display: 'grid',
            fontSize: 11.5,
            gap: 4,
            gridTemplateColumns: 'repeat(7, 1fr)',
          }}
        >
          {ROOSTER_PREVIEW_DAYS.map(day => {
            const slots = availability[day.key]
            const first = slots[0] ?? null

            return (
              <div className="team-rooster-cell" data-open={Boolean(first)} key={day.key}>
                <div style={{ fontSize: 10.5, fontWeight: 700 }}>
                  {day.letter}
                </div>
                <div style={{ fontSize: 10, lineHeight: 1.2, marginTop: 2 }}>
                  {first ? (
                    <>
                      {first.start}
                      <br />
                      {first.end}
                    </>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="text-xs text-muted" style={{ marginTop: 6 }}>
          {linkedTypesCount} afspraaktype
          {linkedTypesCount === 1 ? '' : 'n'} gekoppeld
        </div>
      </div>

      <div
        className="flex-between"
        style={{
          borderTop: '1px solid var(--line-soft)',
          flexWrap: 'wrap',
          gap: 6,
          paddingTop: 10,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={onEdit} type="button">
            Profiel
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onSchedule}
            type="button"
          >
            Rooster bewerken
          </button>
          {canManage && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={onToggleActive}
              type="button"
            >
              {member.active ? 'Deactiveren' : 'Activeren'}
            </button>
          )}
        </div>
        <div>
          {canManage && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={onRemove}
              type="button"
            >
              Verwijderen
            </button>
          )}
          {isHoofdAdmin && !isSelf && (
            <span className="text-xs text-muted">Hoofd-admin</span>
          )}
        </div>
      </div>
    </div>
  )
}
