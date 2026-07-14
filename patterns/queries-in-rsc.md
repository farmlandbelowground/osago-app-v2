# Queries in React Server Components

Server-side data fetching for an RSC happens in feature-colocated `queries.ts` files. Query functions are async, typed, use native `fetch` with explicit caching directives, and parse responses through Zod. RSCs `await` the functions directly — no hooks, no `useEffect`, no client-side fetch.

## queries.ts Colocation

Each feature owns its `queries.ts` file alongside its other module files. The pages under `app/` import from the feature's `queries.ts`; they do not fetch directly.

```
features/posts/
  queries.ts                  # async getPostById, listPosts, listFeatured
  actions.ts                  # mutations — see ./server-actions.md
  types.ts
  components/

app/posts/
  page.tsx                    # imports from features/posts/queries
```

The convention separates routing (under `app/`) from data and UI (under `features/`). A page is one of many possible consumers of a feature's queries; the queries belong to the feature, not to the route.

## Anatomy of a Query Function

A canonical query function declares its Zod schema, exports the inferred type, and exposes an async function that fetches, validates, and returns the typed result.

```typescript
// features/posts/queries.ts
import { z } from 'zod'
import { env } from '@/env'

const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  publishedAt: z.string().datetime(),
})

export type Post = z.infer<typeof PostSchema>

export async function listPosts(): Promise<Post[]> {
  const res = await fetch(`${env.API_URL}/posts`, {
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`listPosts failed: ${res.status}`)

  const json = await res.json()
  return z.array(PostSchema).parse(json)
}
```

Four discipline points are baked into every query:

1. **Typed return.** The function signature declares `Promise<Post[]>` (or whatever shape). Callers get autocomplete on the result.
2. **Native fetch.** No client wrapper, no abstraction layer. Next.js extends `fetch` with the caching directives below; using anything else loses that integration.
3. **Explicit caching strategy.** Every fetch declares its caching intent (see the next section).
4. **Zod parse on the response.** External data is untrusted until parsed. The schema rejects shape drift before it propagates into the UI.

## Caching Strategy Selection

Every fetch declares a caching intent. The four options:

| Strategy | When | Code |
|---|---|---|
| `cache: 'force-cache'` (explicit opt-in; **Next.js 15+ default is uncached/`no-store`**) | Static, rarely-changing — marketing copy, public catalogs | `await fetch(url, { cache: 'force-cache' })` |
| `next: { revalidate: N }` | ISR — news feeds, dashboards refreshing every N seconds | `await fetch(url, { next: { revalidate: 60 } })` |
| `cache: 'no-store'` (also the Next.js 15+ default for unspecified fetch) | Always-fresh — personalized data, auth-dependent reads | `await fetch(url, { cache: 'no-store' })` or simply `await fetch(url)` |
| Tagged: `next: { tags: [...] }` | Selective invalidation via `revalidateTag` after mutations | `await fetch(url, { next: { tags: ['posts'] } })` |

**Next.js 15+ flipped the default**: an unspecified `fetch` is now treated as `cache: 'no-store'` (uncached); caching is **opt-in** via `cache: 'force-cache'` or `next: { revalidate }` or the experimental component-level `'use cache'` directive (with `cacheLife` / `cacheTag`). Pre-Next-15 the default was `force-cache` (silently cached indefinitely). Choose the strategy deliberately for every query. A wrong choice silently degrades correctness (`force-cache` for personalized data shows the wrong user's content) or performance (an unspecified `fetch` on a static catalog will now hammer the upstream because there's no implicit cache to fall back on).

The tagged strategy pairs with `revalidateTag('posts')` inside Server Actions (see [server-actions.md](./server-actions.md)) for selective cache invalidation when a mutation affects a specific resource type.

## Calling Queries from page.tsx

A `page.tsx` is a React Server Component by default. It is `async`, awaits its data, and renders.

```typescript
// app/posts/page.tsx
import { listPosts } from '@features/posts/queries'

export default async function PostsPage() {
  const posts = await listPosts()

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Posts</h1>
      <div className="grid gap-4">
        {posts.map(p => (
          <article key={p.id} className="rounded-card bg-background p-4">
            <h2 className="text-lg font-semibold">{p.title}</h2>
            <p className="text-foreground/70">{p.body}</p>
          </article>
        ))}
      </div>
    </main>
  )
}
```

No `'use client'`. No hooks. No `useEffect`. The page renders on the server with data already in hand; the browser receives HTML, not a loading state followed by a fetch.

## Parallel Fetching with Promise.all

Sequential `await` calls create a waterfall — each fetch waits for the previous one to finish even when they are independent. Use `Promise.all` for parallel fetches.

```typescript
// WRONG — sequential waterfall (total = T(posts) + T(featured))
const posts = await listPosts()
const featured = await listFeatured()
```

```typescript
// CORRECT — parallel (total = max(T(posts), T(featured)))
const [posts, featured] = await Promise.all([
  listPosts(),
  listFeatured(),
])
```

When dependencies exist (one query needs the result of another), keep them sequential — but check whether you can fetch independent siblings in parallel first. The page renders no faster than its slowest query; minimizing the slowest query and parallelizing the rest is the lever.

## Three-Way Data Fetching — Where This Fits

Data-fetching responsibility splits across three patterns. Each has a clearly-bounded role; this pattern documents the first.

- **This pattern (RSC fetch in `queries.ts`) — DEFAULT for reads.** Use whenever data can be fetched at render time on the server. Most reads on most pages fit here.
- **[Server Actions](./server-actions.md) — for mutations.** Create, update, delete. Triggered by form submissions or programmatic calls from client components. Includes cache invalidation via `revalidatePath` or `revalidateTag`.
- **[TanStack Query (opt-in)](./hooks-and-query.md) — for client-reactive data only.** Polling, user-driven filters and pagination after the initial render, optimistic updates, cross-tab sync. Not the default — explicit opt-in when the use case actually requires client reactivity.

See [../rules/data-fetching.md](../rules/data-fetching.md) for the full decision rule and the patterns each path forbids. See [environment-validation.md](./environment-validation.md) for the `env` import used in the canonical fetch above.
