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
    <Link
      className={cn(
        `
          mb-0.5 flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm
          font-medium text-foreground-secondary transition-colors
        `,
        isActive
          ? 'bg-primary-soft font-semibold text-primary-hover'
          : 'hover:bg-border-soft',
      )}
      href={link.href}
    >
      <Icon
        className={cn(
          'shrink-0',
          isActive ? 'text-primary' : 'text-muted-foreground',
        )}
        height={NAV_ICON_SIZE_PX}
        width={NAV_ICON_SIZE_PX}
      />
      {link.label}
    </Link>
  )
}
