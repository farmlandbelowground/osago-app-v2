import { z } from 'zod'

export const StaffProfileRowSchema = z.object({
  created_at: z.string().nullable(),
  email: z.string(),
  first_name: z.string().nullable(),
  id: z.string(),
  last_name: z.string().nullable(),
  phone: z.string().nullable(),
  photo: z.string().nullable(),
  role: z.enum(['admin', 'admin_user', 'customer']),
})

export const ChangeStaffRoleSchema = z.object({
  role: z.enum(['admin', 'user']),
  staffId: z.string().min(1),
})
