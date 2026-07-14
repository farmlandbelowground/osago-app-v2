---
paths: ["src/features/**/queries.ts", "src/features/**/queries/**", "src/features/**/actions.ts", "src/shared/api/**"]
---

# Data Fetching Rules

## The Three-Way Decision Matrix

Every data flow in the app picks one of three paths. Pick before writing code; mixing paths is the source of nearly every data-layer bug.

| Need | Pattern | File | Notes |
|------|---------|------|-------|
| Read data at render time, server-rendered | **RSC native fetch** | `src/features/<name>/queries.ts` | Default for read-only views — pages, lists, dashboards. Awaited directly in a server-rendered page/layout. |
| Mutate data (write) | **Server Actions** | `src/features/<name>/actions.ts` | Sole mutation pathway. See [Server Actions Rules](./server-actions.md). |
| Client-reactive data (polling, user-driven filters/pagination, optimistic updates) | **TanStack Query** | `src/features/<name>/queries/<name>.query.ts` | **Opt-in only**, not the default. Use only when the data changes in response to client interaction or time, not just at navigation. |

The default reading path is RSC `fetch`. The default writing path is Server Actions. TanStack Query is the **escape hatch** for genuinely client-reactive scenarios — most features ship without it.

## Path 1 — RSC Native fetch in `queries.ts`

### When to Use

Use RSC fetch when the data:

- Is read at render time (no client-driven re-fetch)
- Should be server-rendered for performance, SEO, or reduced JS
- Doesn't need to react to user interaction after the page loads

This is the right path for marketing pages, product catalogs, profile views, dashboards on initial load, list pages, detail pages — most reads.

### Caching Strategy

`fetch` in Next.js is cache-aware via the `cache` and `next` options. Choose the strategy per query.

#### Static — `force-cache` (explicit opt-in on Next.js 15+)

For data that never changes at runtime — published articles, marketing copy, static product info:

```typescript
const result = await fetch(`${env.API_URL}/articles/${slug}`, {
  cache: 'force-cache',
})
```

#### Incremental Static Regeneration — `next: { revalidate: N }`

For data that changes occasionally and tolerates being a bit stale — news feeds, catalog listings, dashboards:

```typescript
const result = await fetch(`${env.API_URL}/products`, {
  next: { revalidate: 60 },  // regenerate at most every 60 seconds
})
```

#### Always-Fresh — `cache: 'no-store'`

For per-request data, personalized content, anything that must reflect the current request's auth state:

```typescript
const result = await fetch(`${env.API_URL}/me`, {
  cache: 'no-store',
  headers: { Authorization: `Bearer ${token}` },
})
```

### File Layout

```
src/features/products/
  queries.ts        # async getProductById, listProducts, etc.
  schema.ts         # Zod schemas + derived types
  actions.ts        # 'use server' — mutations
  components/
  index.ts
```

```typescript
// src/features/products/queries.ts
import { env } from '@/env'

import { ProductSchema, ProductsListSchema, type Product } from './schema'

export const getProductById = async (id: string): Promise<Product | null> => {
  const response = await fetch(`${env.API_URL}/products/${id}`, {
    next: { revalidate: 60, tags: ['product', `product:${id}`] },
  })

  if (!response.ok) {
    return null
  }

  const result = ProductSchema.safeParse(await response.json())
  return result.success ? result.data : null
}

export const listProducts = async (): Promise<Product[]> => {
  const response = await fetch(`${env.API_URL}/products`, {
    next: { revalidate: 60, tags: ['product'] },
  })

  if (!response.ok) {
    return []
  }

  const result = ProductsListSchema.safeParse(await response.json())
  return result.success ? result.data : []
}
```

```tsx
// src/app/products/[id]/page.tsx
import { notFound } from 'next/navigation'

import { getProductById } from '@features/products/queries'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params
  const product = await getProductById(id)

  if (!product) {
    notFound()
  }

  return <ProductDetails product={product} />
}
```

For the validation discipline (Zod schema parsing on the wire) and the env barrel, see [API Rules](./api.md).

### Streaming with Suspense (non-blocking reads)

Awaiting a query directly in a page blocks the whole route until it resolves. When part of the page can render immediately and a slower read should stream in behind a fallback, don't await it at the top — start the promise, hand it to a child wrapped in `<Suspense>`, and unwrap it with React 19's `use()` inside that boundary.

```tsx
// app/products/[id]/page.tsx (RSC) — start the slow read, don't await it
import { Suspense } from 'react'

export default async function ProductPage({ params }: Props) {
  const { id } = await params
  const reviewsPromise = getReviews(id) // no await — this stays a promise

  return (
    <>
      <ProductHeader id={id} />
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews reviewsPromise={reviewsPromise} />
      </Suspense>
    </>
  )
}
```

```tsx
// Reviews.tsx ('use client') — unwrap the streamed promise with use()
'use client'

import { use } from 'react'

interface Props {
  reviewsPromise: Promise<Review[]>
}

export const Reviews: FC<Props> = ({ reviewsPromise }) => {
  const reviews = use(reviewsPromise)

  return <ReviewList reviews={reviews} />
}
```

The header renders instantly; the reviews stream in behind their Suspense fallback once the promise resolves. Reserve this for reads where a partial render genuinely helps — a top-level `await` is simpler and correct for the common case where the whole page needs the data before it is useful. `use()` may only unwrap a promise created on the server and passed in as a prop; never create the promise inside the client component.

## Path 2 — Server Actions in `actions.ts`

For mutations — `POST`, `PUT`, `DELETE`, anything that changes server state — use Server Actions. They run on the server, validate input with Zod, mutate, invalidate caches, and return a discriminated result. See [Server Actions Rules](./server-actions.md) for the full pattern, error handling, and `revalidatePath` / `revalidateTag` usage.

This path is **not** optional — direct `fetch('/api', { method: 'POST' })` from a client component is forbidden. Mutations always go through `actions.ts`.

## Path 3 — TanStack Query in `'use client'` Components

TanStack Query is **opt-in** and reaches into a feature only when the data is genuinely client-reactive.

### When to Use — Opt-In Only

Use TanStack Query when the data:

- Changes in response to client-side state (search box, filter chips, pagination clicks)
- Polls on an interval (`refetchInterval`)
- Needs optimistic updates with rollback on failure
- Synchronizes across tabs / browser windows
- Implements offline / stale-while-revalidate patterns

```tsx
// ✅ CORRECT — client-reactive search results, opt-in TanStack Query
'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { searchProducts } from './searchProducts'

export const ProductSearch: FC = () => {
  const [query, setQuery] = useState('')

  const { data: products = [], isPending } = useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () => searchProducts(query),
    enabled: query.length >= 2,
  })

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {isPending ? <Spinner /> : <ProductGrid products={products} />}
    </>
  )
}
```

### When NOT to Use

- **Any read doable at render time** — use RSC fetch instead. TanStack Query in a component that doesn't need client-reactivity ships unnecessary JS, runs an extra network round-trip after hydration, and gains nothing.
- **Mutations needing cache invalidation** — use Server Actions + `revalidatePath` / `revalidateTag`. TanStack `useMutation` followed by `queryClient.invalidateQueries` works for client-side caches but doesn't invalidate framework-level server caches.

### Setup

`<QueryClientProvider>` wraps the **client subtree** that needs it — typically a layout's `'use client'` wrapper, not the root layout. Hooks live alongside the feature:

```
src/features/products/
  queries.ts                    # RSC fetch (Path 1)
  queries/
    useProductSearchQuery.ts    # client-reactive (Path 3)
    index.ts
```

Hook naming: `use<Name>Query` for queries, `use<Name>Mutation` for mutations. Mutations in this layer remain rare — Server Actions cover most cases.

## Forbidden Patterns

### No `fetch` in `useEffect`

```tsx
// ❌ FORBIDDEN — fetch-in-effect waterfall, no caching, no streaming
'use client'

import { useEffect, useState } from 'react'

interface Props {
  id: string
}

export const UserCard: FC<Props> = ({ id }) => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetch(`/api/users/${id}`).then(r => r.json()).then(setUser)
  }, [id])

  return user ? <Card user={user} /> : <Spinner />
}
```

```tsx
// ✅ CORRECT — fetch on the server, pass data down
// page.tsx (RSC)
const user = await getUser(id)
return <UserCard user={user} />

// ✅ CORRECT — TanStack Query if the user changes in response to client interaction
const { data: user } = useUserQuery(id)
```

### No Direct HTTP Client at Call Sites

Direct `fetch` calls outside `queries.ts`, `actions.ts`, or the request helper at `@shared/api/fetcher` scatter the data layer. Centralize. See [API Rules](./api.md).

### No Client-Side Waterfalls

Independent fetches run in **parallel**, not sequentially. The server can fan out three requests at once and stream them back; sequential `await` blocks each one until the previous completes.

```tsx
// ❌ FORBIDDEN — sequential waterfall
const user = await getUser(id)
const orders = await getOrdersForUser(id)
const recommendations = await getRecommendations(id)

// ✅ CORRECT — parallel
const [user, orders, recommendations] = await Promise.all([
  getUser(id),
  getOrdersForUser(id),
  getRecommendations(id),
])
```

When one fetch genuinely depends on the result of another, sequential is correct — but check that the dependency is real, not assumed.

## Caching Strategy Selection Guide

```
Is the data the same for every user?
  ├── Yes → Does it change at runtime?
  │         ├── No  → cache: 'force-cache'
  │         └── Yes → next: { revalidate: N }     (ISR)
  │                   plus next: { tags: [...] } if mutations need to invalidate
  │
  └── No (per-user / per-session / personalized)
            └── cache: 'no-store'
```

When in doubt, start with `revalidate: 60` and tags. ISR with tag invalidation gives you correctness on mutations and performance on reads — a sane default. Move to `force-cache` only when you can prove the data is immutable; move to `no-store` only when you can prove the data is per-request.

## Tagging fetch for `revalidateTag`

Tags applied at the **fetch site** are what enable tag-based invalidation. Without tags, `revalidateTag('user')` has nothing to find.

```typescript
// In queries.ts — tag every fetch with the relevant cache key
const response = await fetch(`${env.API_URL}/users/${id}`, {
  next: {
    revalidate: 60,
    tags: ['user', `user:${id}`],  // both general and specific tags
  },
})
```

```typescript
// In actions.ts — invalidate by tag after a mutation
'use server'

import { revalidateTag } from 'next/cache'

export const updateUser = async (
  prevState: UpdateUserState,
  formData: FormData,
): Promise<UpdateUserState> => {
  // ... validate + mutate ...

  revalidateTag(`user:${result.data.id}`)  // invalidate one user
  // or revalidateTag('user') to invalidate all user fetches
  return { success: true, data: result.data }
}
```

The tag scheme is a feature-owned vocabulary — define the tag strings as constants in [`constants.ts`](./constants.md) so the same string lives in one place and is consumed by both the fetch and the invalidation. See [Constants Rules](./constants.md) for the placement convention.

For type definitions backing each query result and the discriminated returns from queries and actions, follow [Typing Rules](./typing.md). For the boundary decision that determines whether a consumer is RSC or client, see [RSC vs Client Components](./rsc-vs-client.md).
