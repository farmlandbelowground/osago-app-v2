import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

import { PATHNAME_HEADER } from '@shared/constants/headers'

// Forwards the requested pathname as a header so (app)/layout.tsx can tell
// which route is being rendered — Server Components have no other way to
// read the current pathname. Carries no auth/business logic itself; the
// lock-status check stays in the layout per slice-03 spec §5 Decision 1.
export function proxy(request: NextRequest): NextResponse {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(PATHNAME_HEADER, request.nextUrl.pathname)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
