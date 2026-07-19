'use client'

import Link from 'next/link'
import { type FC } from 'react'

import { logout } from '@shared/auth/actions'
import { Logo } from '@shared/components/Logo'

import { HelpIcon, LogoutIcon } from '../../assets/icons'
import {
  FOOTER_ICON_SIZE_PX,
  NAV_SECTIONS,
  USER_AVATAR_SIZE_PX,
} from '../../constants'
import { buildDisplayName, buildInitials } from '../../lib/buildUserDisplay'
import { NavItem } from '../NavItem'
import { type Props } from './types'

export const Sidebar: FC<Props> = ({ email, firstName, lastName }) => {
  return (
    <aside className="sidebar">
      <Logo />

      <nav>
        {NAV_SECTIONS.map(section => (
          <div className="nav-section" key={section.title ?? 'primary'}>
            {section.title && (
              <div className="nav-section-title">{section.title}</div>
            )}
            {section.links.map(link => (
              <NavItem key={link.href} link={link} />
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-foot">
        <Link className="user-block" href="/account" title="Mijn account">
          <div
            className="user-avatar"
            style={{
              height: USER_AVATAR_SIZE_PX,
              width: USER_AVATAR_SIZE_PX,
            }}
          >
            {buildInitials(firstName, lastName)}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div className="user-name">
              {buildDisplayName(firstName, lastName, email)}
            </div>
            <div className="user-email">{email}</div>
          </div>
        </Link>
        <button
          aria-label="Hulp nodig? Start chat"
          className="help-btn"
          title="Hulp nodig? Start chat"
          type="button"
        >
          <HelpIcon height={FOOTER_ICON_SIZE_PX} width={FOOTER_ICON_SIZE_PX} />
        </button>
        <button
          className="logout-btn"
          onClick={() => void logout()}
          title="Uitloggen"
          type="button"
        >
          <LogoutIcon
            height={FOOTER_ICON_SIZE_PX}
            width={FOOTER_ICON_SIZE_PX}
          />
        </button>
      </div>
    </aside>
  )
}
