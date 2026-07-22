import { redirect } from 'next/navigation'

import { ADMIN_DASHBOARD_PATH } from '@features/admin-dashboard'

// Legacy's default admin page is the dashboard (osago-bundle.js enterAdminApp).
export default function AdminIndexPage() {
  redirect(ADMIN_DASHBOARD_PATH)
}
