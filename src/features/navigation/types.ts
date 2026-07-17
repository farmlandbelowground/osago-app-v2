import { type ComponentType, type SVGProps } from 'react'

export interface NavLink {
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
}

export interface NavSection {
  links: NavLink[]
  requiresFullAdmin?: boolean
  title?: string
}
