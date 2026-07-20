'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import { NAV_ICON_SIZE_PX } from '../../constants'
import { type Props } from './types'

export const NavItem: FC<Props> = ({ link }) => {
  const pathname = usePathname()
  const isActive = pathname === link.href
  const Icon = link.icon

  return (
    <Link className={cn('nav-item', isActive && 'active')} href={link.href}>
      <Icon
        className="nav-icon"
        height={NAV_ICON_SIZE_PX}
        width={NAV_ICON_SIZE_PX}
      />
      {link.label}
    </Link>
  )
}
