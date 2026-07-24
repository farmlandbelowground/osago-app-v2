'use client'

import Image from 'next/image'
import Link from 'next/link'
import { type FC } from 'react'

import { logout } from '@shared/auth/actions'
import { Logo } from '@shared/components/Logo'

import { LogoutIcon } from '../../assets/icons'
import {
  FOOTER_ICON_SIZE_PX,
  MEDEWERKER_NAV_SECTION,
  NAV_SECTIONS,
  USER_AVATAR_SIZE_PX,
} from '../../constants'
import { buildDisplayName, buildInitials } from '../../lib/buildUserDisplay'
import { HelpButton } from '../HelpButton'
import { NavItem } from '../NavItem'
import { type Props } from './types'

export const Sidebar: FC<Props> = ({
  allowedPaths,
  email,
  firstName,
  isMedewerker = false,
  lastName,
  photo,
}) => {
  // The medewerker-only "In ontwikkeling" section is appended only while an
  // Osago employee is impersonating (index.html:309-316); a real customer never
  // sees it.
  const sections = isMedewerker
    ? [...NAV_SECTIONS, MEDEWERKER_NAV_SECTION]
    : NAV_SECTIONS

  // Hide nav links the customer's plan doesn't grant (ports
  // applyCustomerPlanVisibility, osago-bundle.js:2906-2932). `null` = full plan,
  // everything visible. A section with no visible links is dropped entirely.
  const visibleSections = sections.map(section => ({
    ...section,
    links: section.links.filter(
      link => allowedPaths === null || allowedPaths.includes(link.href),
    ),
  })).filter(section => section.links.length > 0)

  return (
    <aside className="sidebar">
      <Logo />

      <nav>
        {visibleSections.map(section => (
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
            {photo ? (
              <Image
                alt="Profielfoto"
                height={USER_AVATAR_SIZE_PX}
                src={photo}
                width={USER_AVATAR_SIZE_PX}
              />
            ) : (
              buildInitials(firstName, lastName)
            )}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div className="user-name">
              {buildDisplayName(firstName, lastName, email)}
            </div>
            <div className="user-email">{email}</div>
          </div>
        </Link>
        <HelpButton />
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
