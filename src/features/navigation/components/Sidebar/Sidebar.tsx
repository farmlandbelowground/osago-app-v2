'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type FC, type SVGProps } from 'react'

import { type ScreenState } from '@features/preparation'
import { logout } from '@shared/auth/actions'
import { Logo } from '@shared/components/Logo'
import { cn } from '@shared/utils/cn'

import {
  DashboardIcon,
  DocumentenkluisIcon,
  KopermatchingIcon,
  LogoutIcon,
  VerkoopklaarMakenIcon,
  VerkoopprocesIcon,
} from '../../assets/icons'
import {
  FOOTER_ICON_SIZE_PX,
  MEDEWERKER_NAV_SECTION,
  NAV_ICON_SIZE_PX,
  NAV_SECTIONS,
  USER_AVATAR_SIZE_PX,
} from '../../constants'
import { buildDisplayName, buildInitials } from '../../lib/buildUserDisplay'
import { SCREEN_ICON } from '../../lib/screenIcons'
import { HelpButton } from '../HelpButton'
import { NavItem } from '../NavItem'
import { type Props } from './types'

const CheckIcon: FC = () => (
  <svg
    fill="none"
    height="14"
    stroke="currentColor"
    strokeWidth="2.6"
    viewBox="0 0 24 24"
    width="14"
  >
    <path d="M5 13l4 4L19 7" />
  </svg>
)

const LockIcon: FC = () => (
  <svg
    fill="none"
    height="14"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
    width="14"
  >
    <rect height="9" rx="1.5" width="14" x="5" y="11" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
)

const ChevronIcon: FC<{ open: boolean }> = ({ open }) => (
  <svg
    fill="none"
    height="12"
    stroke="currentColor"
    strokeWidth="2"
    style={{
      transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
      transition: 'transform 0.2s',
    }}
    viewBox="0 0 24 24"
    width="12"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
)

const StatusIndicator: FC<{ status: ScreenState['status'] }> = ({ status }) => {
  if (status === 'done') {
    return (
      <span className="nav-state nav-state-done">
        <CheckIcon />
      </span>
    )
  }
  if (status === 'current') {
    return <span className="nav-state nav-state-ring" />
  }
  return (
    <span className="nav-state nav-state-lock">
      <LockIcon />
    </span>
  )
}

const PreparationScreenItem: FC<{ screen: ScreenState }> = ({ screen }) => {
  const pathname = usePathname()
  const isActive = pathname === screen.path
  const Icon = SCREEN_ICON[screen.id]

  if (screen.status === 'locked') {
    return (
      <span
        aria-disabled="true"
        className={cn('nav-item', 'locked')}
        title="Rond eerst de vorige stap af."
      >
        <Icon
          className="nav-icon"
          height={NAV_ICON_SIZE_PX}
          width={NAV_ICON_SIZE_PX}
        />
        {screen.label}
        <StatusIndicator status={screen.status} />
      </span>
    )
  }

  return (
    <Link
      className={cn('nav-item', isActive && 'active')}
      href={screen.path}
    >
      <Icon
        className="nav-icon"
        height={NAV_ICON_SIZE_PX}
        width={NAV_ICON_SIZE_PX}
      />
      {screen.label}
      <StatusIndicator status={screen.status} />
    </Link>
  )
}

const SellItem: FC<{
  Icon: FC<SVGProps<SVGSVGElement>>
  href: string
  label: string
  locked: boolean
}> = ({ Icon, href, label, locked }) => {
  const pathname = usePathname()
  const isActive = pathname === href

  if (locked) {
    return (
      <span
        aria-disabled="true"
        className={cn('nav-item', 'locked')}
        title="Rond eerst je voorbereiding en identiteitsverificatie af."
      >
        <Icon
          className="nav-icon"
          height={NAV_ICON_SIZE_PX}
          width={NAV_ICON_SIZE_PX}
        />
        {label}
        <span className="nav-state nav-state-lock">
          <LockIcon />
        </span>
      </span>
    )
  }

  return (
    <Link className={cn('nav-item', isActive && 'active')} href={href}>
      <Icon
        className="nav-icon"
        height={NAV_ICON_SIZE_PX}
        width={NAV_ICON_SIZE_PX}
      />
      {label}
    </Link>
  )
}

export const Sidebar: FC<Props> = ({
  allowedPaths,
  email,
  firstName,
  identityStatus,
  isMedewerker = false,
  lastName,
  photo,
  preparation,
}) => {
  // Journey-view is only rendered when the layout hands us a PreparationState
  // (i.e. for customer sessions). Admin/no-session paths fall back to the
  // old thematic NAV_SECTIONS below.
  const showJourney = Boolean(preparation)
  const prepComplete = preparation?.isComplete ?? false
  const sellUnlocked = prepComplete && identityStatus === 'verified'

  const [prepOpen, setPrepOpen] = useState(!prepComplete)

  const dashboardHref = '/dashboard'
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      <Logo />

      <nav>
        {showJourney ? (
          <>
            <div className="nav-section">
              <Link
                className={cn(
                  'nav-item',
                  pathname === dashboardHref && 'active',
                )}
                href={dashboardHref}
              >
                <DashboardIcon
                  className="nav-icon"
                  height={NAV_ICON_SIZE_PX}
                  width={NAV_ICON_SIZE_PX}
                />
                Dashboard
              </Link>
            </div>

            <div className="nav-section prep-section">
              <button
                className="nav-section-title prep-toggle"
                onClick={
                  prepComplete
                    ? () => setPrepOpen(open => !open)
                    : undefined
                }
                type="button"
              >
                <span>Voorbereiding</span>
                {prepComplete && (
                  <>
                    <span className="prep-status">
                      <CheckIcon />
                    </span>
                    <span className="prep-chevron">
                      <ChevronIcon open={prepOpen} />
                    </span>
                  </>
                )}
              </button>
              {prepOpen &&
                (preparation?.groups ?? []).map(group => {
                  const groupScreens = (preparation?.screens ?? []).filter(
                    s => s.group === group.id,
                  )
                  return (
                    <div key={group.id}>
                      <div className="deel-label">
                        <span className="deel-n">
                          Stap {group.stepNumber}
                        </span>{' '}
                        · {group.label}
                      </div>
                      {groupScreens.map(screen => (
                        <PreparationScreenItem
                          key={screen.id}
                          screen={screen}
                        />
                      ))}
                    </div>
                  )
                })}
            </div>

            <div className="nav-section">
              <div
                className={cn(
                  'nav-section-title',
                  !sellUnlocked && 'has-lock',
                )}
              >
                {!sellUnlocked && (
                  <span className="section-lock">
                    <LockIcon />
                  </span>
                )}
                Verkoop
              </div>
              <SellItem
                Icon={KopermatchingIcon}
                href="/kopermatching"
                label="Kopermatching"
                locked={!sellUnlocked}
              />
              <SellItem
                Icon={VerkoopprocesIcon}
                href="/verkoopproces"
                label="Verkoopproces"
                locked={!sellUnlocked}
              />
            </div>

            <div className="nav-section">
              <Link
                className={cn(
                  'nav-item',
                  pathname === '/documentenkluis' && 'active',
                )}
                href="/documentenkluis"
              >
                <DocumentenkluisIcon
                  className="nav-icon"
                  height={NAV_ICON_SIZE_PX}
                  width={NAV_ICON_SIZE_PX}
                />
                Documentenkluis
              </Link>
            </div>

            {isMedewerker && (
              <div className="nav-section">
                <div className="nav-section-title">In ontwikkeling</div>
                <Link
                  className={cn(
                    'nav-item',
                    pathname === '/verkoopklaar-maken' && 'active',
                  )}
                  href="/verkoopklaar-maken"
                >
                  <VerkoopklaarMakenIcon
                    className="nav-icon"
                    height={NAV_ICON_SIZE_PX}
                    width={NAV_ICON_SIZE_PX}
                  />
                  Verkoopklaar maken
                </Link>
              </div>
            )}
          </>
        ) : (
          // Legacy thematic fallback — kept for any caller without a
          // preparation prop (e.g. server-restricted sessions without a
          // fetchable prep state). Same allowedPaths gating as before.
          (isMedewerker
            ? [...NAV_SECTIONS, MEDEWERKER_NAV_SECTION]
            : NAV_SECTIONS
          )
            .map(section => ({
              ...section,
              links: section.links.filter(
                link =>
                  allowedPaths === null || allowedPaths.includes(link.href),
              ),
            }))
            .filter(section => section.links.length > 0)
            .map(section => (
              <div className="nav-section" key={section.title ?? 'primary'}>
                {section.title && (
                  <div className="nav-section-title">{section.title}</div>
                )}
                {section.links.map(link => (
                  <NavItem key={link.href} link={link} />
                ))}
              </div>
            ))
        )}
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
