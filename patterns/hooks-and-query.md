# Hooks and TanStack Query

TanStack Query is **opt-in**, used only for client-reactive data — polling, user-driven filters or pagination after the initial render, optimistic updates with rollback, cross-tab synchronization. The default data-fetching path is RSC native fetch in `queries.ts` (see [queries-in-rsc.md](./queries-in-rsc.md)); mutations live in Server Actions in `actions.ts` (see [server-actions.md](./server-actions.md)). Reach for TanStack only when the use case actually requires client reactivity.

## TanStack Query — Client-Reactive Only

### When to Use

- **Polling intervals.** A dashboard widget refreshing every 5 seconds via `refetchInterval`.
- **Client-driven filters or pagination.** The initial render fetches via RSC; subsequent filter changes happen in the browser without a page reload.
- **Optimistic updates with rollback.** A like-button or comment-post that updates the UI before the server confirms, with `onMutate` setting up rollback context and `onError` reverting.
- **Cross-tab synchronization.** Two tabs of the same app, mutations in one tab refresh the other via TanStack's broadcast channel.
- **Offline / stale-while-revalidate UX.** Showing cached data instantly while a background refetch verifies freshness.

### When NOT to Use

- **Any read that can happen at render time on the server.** Use RSC fetch in `queries.ts` instead — [queries-in-rsc.md](./queries-in-rsc.md). The page renders with data, the browser receives HTML, no loading spinner.
- **Mutations needing cache invalidation.** Use Server Actions plus `revalidatePath` or `revalidateTag` — [server-actions.md](./server-actions.md). TanStack mutations are reserved for optimistic-UX flows where re-fetching after server confirmation is acceptable.

If neither client reactivity nor optimistic UX is required, TanStack adds dependency weight and a second cache layer for no benefit. The default is server-side; TanStack is the explicit opt-in.

## QueryClient Provider Placement

The `QueryClientProvider` wraps only the client subtree that needs TanStack — typically a layout-level client component, NOT the root `app/layout.tsx` (which stays a Server Component).

```tsx
// shared/components/QueryProvider/QueryProvider.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000 },
        },
      }),
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
```

The provider is wrapped inside whichever layout actually consumes TanStack (often a `(app)/layout.tsx` for the authenticated portion of the app), preserving RSC at the root. Each render gets a stable `QueryClient` thanks to `useState(() => ...)`.

## Custom Hook Wrapping Pattern

Direct calls to `useQuery` and `useMutation` from components are rare. Wrap each query and mutation in a domain-named custom hook so the component imports a focused, well-typed surface.

The custom hook lives in the feature's `hooks/` directory and follows the typing discipline documented in [custom-hook-typing.md](./custom-hook-typing.md).

```
features/users/hooks/
  useUserList/
    useUserList.ts            # implementation
    types.ts                  # Args (filters), Result interface, UseUserList alias
    index.ts                  # public re-export
```

### Result Interface and Selective Return

The hook's `Result` returns only the fields the component needs. Drop fields consumers don't use (TanStack returns ~20 fields per query; most components consume two or three).

```typescript
// features/users/hooks/useUserList/types.ts
import { type User } from '@features/users/types'

export interface Args {
  search: string
  page: number
}

export interface Result {
  users: User[] | null
  isLoading: boolean
  isFetched: boolean
  refetch: () => Promise<void>
}

export type UseUserList = (args: Args) => Result
```

### Hook Implementation

```typescript
// features/users/hooks/useUserList/useUserList.ts
import { useQuery } from '@tanstack/react-query'
import { fetchUsers } from '@features/users/api'
import { type UseUserList } from './types'

export const useUserList: UseUserList = (filters) => {
  const { data, isLoading, isFetching, isFetched, refetch } = useQuery({
    queryKey: ['users', 'list', filters],
    queryFn: () => fetchUsers(filters),
  })

  return {
    users: data ?? null,
    isLoading: isLoading || isFetching,
    isFetched,
    refetch: async () => {
      await refetch()
    },
  }
}
```

The component imports `useUserList(filters)` and gets a clean, typed result. The TanStack details (cache management, refetch flags) stay encapsulated.

## Query Keys

Query keys are arrays. Conventions:

- **Feature-scoped first segment.** `['users', ...]` for queries in the `users` feature, `['posts', ...]` for the `posts` feature. Selective invalidation by feature becomes one call: `queryClient.invalidateQueries({ queryKey: ['users'] })`.
- **Operation as second segment.** `['users', 'list', ...]`, `['users', 'detail', ...]`. Distinguishes the read shape.
- **Parameters object as final segment.** `['users', 'list', { search, page }]`. The object is shallow-compared by TanStack to detect cache hits.
- **No bare strings.** `'users-list'` works but blocks selective invalidation. Always use the structured array.

### Stable Across Renders

Filter objects passed as keys must be stable. When the parent re-renders frequently, memoize the filters object so the key reference does not change:

```typescript
const filters = useMemo(() => ({ search, page }), [search, page])
const { users } = useUserList(filters)
```

Without memoization, every parent render produces a new filters object and TanStack treats it as a new query.

## Stale Time Guidance

`staleTime` controls when a cached entry is considered fresh. While fresh, TanStack returns the cached value instantly without a background refetch.

- **Default: `staleTime: 60_000` (1 minute).** Reasonable for typical UI reads.
- **Auth-sensitive or rapidly-changing data: lower (or zero).** A `staleTime: 0` means every consumer triggers a refetch; consider whether RSC fetch with `cache: 'no-store'` is a better fit instead.
- **Reference data (countries, currencies, role definitions): higher.** `staleTime: 5 * 60_000` or more.

`staleTime` and `gcTime` (formerly `cacheTime`) are different concerns. `staleTime` is "is this fresh?"; `gcTime` is "how long do I keep this in memory after the last subscriber unmounts?". The defaults for each are reasonable starting points; tune `staleTime` per query class as needed.

## Mutations and Optimistic Updates

`useMutation` is the right tool when the UX needs immediate feedback before the server confirms — think likes, votes, optimistic adds.

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type Comment } from '@features/comments/types'
import { addComment } from '@features/comments/api'

export function useAddComment(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (text: string) => addComment(postId, text),
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: ['comments', postId] })
      const previous = queryClient.getQueryData<Comment[]>(['comments', postId])

      queryClient.setQueryData<Comment[]>(['comments', postId], (old) => [
        ...(old ?? []),
        { id: 'temp', text, createdAt: new Date().toISOString() },
      ])

      return { previous }
    },
    onError: (_err, _text, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['comments', postId], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    },
  })
}
```

The hook returns a `mutate` function the component calls; TanStack handles the lifecycle (`onMutate` → optimistic update + rollback context → success or error → `onSettled` → invalidate).

For mutations that don't need optimistic UX, prefer Server Actions ([server-actions.md](./server-actions.md)) — `revalidatePath` and `revalidateTag` give cleaner cache invalidation across the RSC-rendered surface.

See [../rules/data-fetching.md](../rules/data-fetching.md) for the full three-way decision rule and [custom-hook-typing.md](./custom-hook-typing.md) for the type-alias discipline applied to every TanStack wrapper.
