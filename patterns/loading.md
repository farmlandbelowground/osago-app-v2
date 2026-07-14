# Loading Pattern

Loading states in App Router use two complementary mechanisms: a `loading.tsx` sibling that auto-wraps the route segment in `<Suspense>`, and explicit `<Suspense>` boundaries inside the component tree for granular streaming. Skeleton UIs are preferred for layout-shift prevention; spinners are reserved for discrete non-layout-affecting operations.

## loading.tsx — Auto-Suspense Per Segment

A `loading.tsx` co-located with `page.tsx` in the same segment folder is automatically wrapped by Next.js in `<Suspense fallback={<Loading />}>`. The fallback renders instantly while `page.tsx` awaits its data; once data resolves, the page replaces the fallback.

```tsx
// app/posts/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-6 w-1/3 animate-pulse rounded bg-foreground/10" />
      <div className="h-32 animate-pulse rounded bg-foreground/10" />
      <div className="h-32 animate-pulse rounded bg-foreground/10" />
    </div>
  )
}
```

`loading.tsx` is server-rendered by default — it ships fast initial paint without bundling client JavaScript. The skeleton appears the moment the user navigates; no flicker, no spinner.

## Explicit \<Suspense\> for Streaming

When a slow data section should not block faster sections, wrap the slow part in an explicit `<Suspense>`. The rest of the page renders immediately; the wrapped subtree streams in when its data resolves.

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { FastWidget } from '@features/dashboard/components/FastWidget'
import { SlowAnalytics } from '@features/dashboard/components/SlowAnalytics'
import { AnalyticsSkeleton } from '@features/dashboard/components/AnalyticsSkeleton'

export default function DashboardPage() {
  return (
    <div className="grid gap-6 p-6">
      <FastWidget />
      <Suspense fallback={<AnalyticsSkeleton />}>
        <SlowAnalytics />
      </Suspense>
    </div>
  )
}
```

`FastWidget` renders immediately. `SlowAnalytics` streams in after its data resolves — without it the whole page would wait for the slowest fetch.

### Granular Streaming

Multiple `<Suspense>` boundaries allow independent streaming of different sections. Each boundary has its own fallback; each resolves when its subtree's data is ready.

### Slow Subtree Isolation

Reach for explicit `<Suspense>` when a single page mixes fast and slow data sources. The `loading.tsx` sibling blocks the entire segment; explicit boundaries unblock the fast parts while keeping the slow parts isolated behind their own fallbacks.

## Skeleton vs Spinner

Pick the fallback shape based on whether the loading state will affect layout when the real content arrives.

- **Skeleton — preferred for layout-affecting content.** Lists, cards, headers, sidebars. The skeleton reserves the space the real content will occupy; when data arrives, no layout shift, no jump.
- **Spinner — acceptable for transient, non-layout actions.** Button-press feedback, modal-open in-flight indicator, refetch hint on a small icon. The spinner is a discrete element that does not change page geometry.

```
WRONG:  spinner for full-page initial load — content paints, layout shifts, CLS jump
CORRECT: skeleton for full-page initial load — space reserved, content paints in place
```

A skeleton's job is to preserve the layout's visual contract while the data is in flight. A spinner's job is to indicate that something is happening without occupying meaningful page space. Misuse either and the UX gets worse: a full-page spinner promises uncertainty; a skeleton on a save button promises progress that never arrives.

## Code Examples

A `loading.tsx` paired with the page it wraps:

```tsx
// app/profile/page.tsx
import { getCurrentUser } from '@features/profile/queries'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">{user.name}</h1>
      <p>{user.bio}</p>
    </main>
  )
}
```

```tsx
// app/profile/loading.tsx
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="h-8 w-1/2 animate-pulse rounded bg-foreground/10" />
      <div className="h-24 animate-pulse rounded bg-foreground/10" />
    </div>
  )
}
```

The skeleton's geometry mirrors the real page — heading height plus body block — so the transition is visually seamless.

See [error-boundary.md](./error-boundary.md) for the parallel mechanism that handles errors, [page-and-layout.md](./page-and-layout.md) for `loading.tsx`'s placement in the broader page anatomy, and [queries-in-rsc.md](./queries-in-rsc.md) for the data-side mechanism that actually triggers loading states.
