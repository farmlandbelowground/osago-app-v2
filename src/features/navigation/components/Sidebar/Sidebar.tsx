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
    <aside
      className={`
        fixed top-0 left-0 flex h-screen w-(--sidebar-width) flex-col border-r
        border-border bg-surface px-4 py-6
        max-[900px]:relative max-[900px]:h-auto max-[900px]:w-full
        max-[900px]:flex-row max-[900px]:flex-wrap max-[900px]:p-3
      `}
    >
      <Logo className={`
        m-2 mb-8 h-7 w-[87px]
        max-[900px]:m-0 max-[900px]:mr-3
      `} />

      <nav className={`
        flex-1 overflow-y-auto
        max-[900px]:contents
      `}>
        {NAV_SECTIONS.map(section => (
          <div
            className={`
              mb-6
              max-[900px]:m-0 max-[900px]:flex max-[900px]:flex-wrap
              max-[900px]:gap-1
            `}
            key={section.title ?? 'primary'}
          >
            {section.title && (
              <div className={`
                mb-2 px-3 text-[11px] font-semibold tracking-wider
                text-muted-foreground uppercase
                max-[900px]:hidden
              `}>
                {section.title}
              </div>
            )}
            {section.links.map(link => (
              <NavItem key={link.href} link={link} />
            ))}
          </div>
        ))}
      </nav>

      <div className={`
        mt-auto flex items-center gap-2.5 border-t border-border p-3
        max-[900px]:mt-0 max-[900px]:ml-auto max-[900px]:border-0
        max-[900px]:p-0
      `}>
        <Link
          className={`
            -m-1.5 flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2
            py-1.5 transition-colors
            hover:bg-border-soft
          `}
          href="/account"
        >
          <div
            className={`
              flex shrink-0 items-center justify-center rounded-full
              bg-gradient-to-br from-primary to-primary-hover text-[13px]
              font-semibold text-primary-foreground
            `}
            style={{
              height: USER_AVATAR_SIZE_PX,
              width: USER_AVATAR_SIZE_PX,
            }}
          >
            {buildInitials(firstName, lastName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-foreground">
              {buildDisplayName(firstName, lastName, email)}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {email}
            </div>
          </div>
        </Link>
        <button
          aria-label="Hulp nodig? Start chat"
          className={`
            rounded-md p-1.5 text-muted-foreground
            hover:bg-border-soft hover:text-foreground
          `}
          title="Hulp nodig? Start chat"
          type="button"
        >
          <HelpIcon height={FOOTER_ICON_SIZE_PX} width={FOOTER_ICON_SIZE_PX} />
        </button>
        <button
          className={`
            rounded-md p-1.5 text-muted-foreground
            hover:bg-border-soft hover:text-foreground
          `}
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
