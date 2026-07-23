import { type Availability } from '@shared/types/availability'

export type StaffRole = 'admin' | 'user'

export interface StaffMemberFormData {
  active: boolean
  email: string
  firstName: string
  lastName: string
  password: string
  phone: string
  photo: string | null
  role: StaffRole
}

export interface StaffMember {
  active: boolean
  availability: Availability | null
  createdAt: number | null
  email: string
  firstName: string
  id: string
  lastName: string
  phone: string
  photo: string | null
  role: StaffRole
}
