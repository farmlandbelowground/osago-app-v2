import { type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function AdminLayout({ children }: Props) {
  return <div className="min-h-screen">{children}</div>
}
