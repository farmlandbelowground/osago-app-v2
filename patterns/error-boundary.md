# Error Boundary Pattern

Error handling in App Router uses three complementary mechanisms: a per-segment `error.tsx` sibling that auto-wraps the segment in a React Error Boundary; a root `global-error.tsx` for unhandled errors that escape every nested boundary; and a `notFound()` signal paired with `not-found.tsx` for missing-resource flows.

## error.tsx — Per-Segment Error Boundary

A `error.tsx` file co-located with `page.tsx` in a segment folder is automatically wrapped by Next.js in a React Error Boundary. When a component below it throws, the boundary catches the error and renders the `error.tsx` component instead.

### 'use client' Required

Error boundaries need client-side React, so `error.tsx` MUST start with `'use client'`. It is the only piece of error-handling infrastructure that ships to the browser; everything else (Server Actions throwing redirects, queries throwing on bad responses) runs on the server.

### error + reset Props

The boundary passes two props to the component:

- `error: Error & { digest?: string }` — the thrown error. The `digest` is a stable id Next.js assigns for matching client errors with server logs.
- `reset: () => void` — a function that re-renders the segment. The user clicks it to retry without navigating away.

### Recovery UI

The component shows the error message and a "Try again" button calling `reset()`. Production builds typically show a generic message ("Something went wrong") rather than the raw error, with the digest available for support correlation.

```tsx
// app/posts/error.tsx
'use client'

import { useEffect } from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    // log to monitoring service
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 p-6">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-foreground/70">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-card bg-brand-500 px-4 py-2 text-white"
      >
        Try again
      </button>
    </div>
  )
}
```

The boundary is segment-scoped: an error inside `app/posts/[id]/page.tsx` is caught by `app/posts/error.tsx` (or the closest `error.tsx` ancestor). Surrounding layouts (`app/layout.tsx`, `app/posts/layout.tsx`) keep rendering — the user still sees the navigation, sidebar, and other persistent UI while the failed segment shows its recovery UI.

## global-error.tsx — Root-Level Catch-All

When an error escapes every nested `error.tsx`, Next.js falls back to `global-error.tsx` at the root.

### \<html\> and \<body\> Tags Required

`global-error.tsx` replaces the root layout entirely on a critical failure — the failure may have occurred inside the root layout itself. The component MUST therefore include its own `<html>` and `<body>` tags.

```tsx
// app/global-error.tsx
'use client'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-semibold">Application error</h2>
          <p className="text-foreground/70">An unexpected error occurred.</p>
          <button
            onClick={reset}
            className="rounded-card bg-brand-500 px-4 py-2 text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
```

Keep `global-error.tsx` minimal. It runs in a degraded environment where the root layout might be the failure source; depending on stylesheets, fonts, or providers it might not have access to is a recipe for cascading failure.

## When to Add Per-Segment vs Rely on Root

Two reasonable defaults:

- **Add `error.tsx` at the layout-segment level** — typically `(app)/error.tsx` and `(auth)/error.tsx`. The persistent navigation stays visible; only the failed segment's content shows the recovery UI.
- **Let leaf pages bubble up** to the layout boundary unless they have a specific recovery UX (retry a single fetch, refresh a single dashboard widget within the layout).

Add a leaf-level `error.tsx` only when the recovery experience is meaningfully different from what the layout boundary would show. Otherwise the duplication is overhead.

Always have `global-error.tsx`. It is the safety net for everything that escapes every nested boundary, including errors thrown inside the root layout itself.

## notFound() and not-found.tsx

For "this resource does not exist" flows, use `notFound()` from `next/navigation`. The function throws a special signal Next.js intercepts and renders the segment's `not-found.tsx` instead of `error.tsx`.

```typescript
// features/posts/queries.ts
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { env } from '@/env'

const PostSchema = z.object({ id: z.string(), title: z.string(), body: z.string() })
export type Post = z.infer<typeof PostSchema>

export async function getPostById(id: string): Promise<Post> {
  const res = await fetch(`${env.API_URL}/posts/${id}`)
  if (res.status === 404) notFound()
  if (!res.ok) throw new Error(`getPostById failed: ${res.status}`)
  return PostSchema.parse(await res.json())
}
```

The companion file:

```tsx
// app/posts/[id]/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 p-6">
      <h2 className="text-xl font-semibold">Post not found</h2>
      <p className="text-foreground/70">The post you're looking for does not exist.</p>
      <Link href="/posts" className="text-brand-500 underline">
        Back to all posts
      </Link>
    </div>
  )
}
```

`not-found.tsx` is for "resource missing" — a semantic 404. `error.tsx` is for "something went wrong" — a 5xx, a network failure, a validation crash, an upstream timeout. Use the right one per case; the user-facing copy and the support workflow differ.

See [loading.md](./loading.md) for the parallel suspense mechanism, [page-and-layout.md](./page-and-layout.md) for where `error.tsx` lives in the page anatomy, and [styling-tailwind.md](./styling-tailwind.md) for the conventions used in the recovery UI examples.
