# Page and Layout Pattern

Every page in a Next.js project follows a strict shape. By default, a page is a React Server Component (RSC) — an `async` function that awaits data and returns JSX. Layouts wrap pages with persistent UI (navigation, sidebars, providers). Client-side interactivity uses **multiple focused, domain-named hooks** rather than a single monolithic logic hook.

## RSC by Default — page.tsx as async Function

A `page.tsx` under `app/` is an async function that fetches its data via feature-colocated `queries.ts` and renders JSX. There is no `'use client'` at the top — the file is a Server Component, the browser receives HTML, no fetch-loading-render cycle runs in the user's browser.

```typescript
// app/posts/page.tsx
import { listPosts } from '@features/posts/queries'
import { PostCard } from '@features/posts/components/PostCard'

export default async function PostsPage() {
  const posts = await listPosts()

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Posts</h1>
      <div className="grid gap-4">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </main>
  )
}
```

The page is a thin composer: import a query, await it, render the result. Heavy logic stays in the feature's `queries.ts` (data) or in the components it composes (UI). See [queries-in-rsc.md](./queries-in-rsc.md) for the canonical query shape.

## layout.tsx — Persistent UI Wrappers

A `layout.tsx` wraps `page.tsx` and any nested children. It re-mounts only when the segment it owns changes — navigations within the segment keep the layout state intact (a sidebar's scroll position, an expanded menu, a provider's React tree).

```typescript
// app/(app)/layout.tsx
import { type ReactNode } from 'react'
import { Sidebar } from '@features/navigation/components/Sidebar'

interface Props {
  children: ReactNode
}

export default function AppLayout({ children }: Props) {
  return (
    <div className="grid grid-cols-[240px_1fr]">
      <Sidebar />
      <div>{children}</div>
    </div>
  )
}
```

Layouts are RSC by default too. Use them for navigation, sidebars, headers, and providers — anything that should persist across navigations within the segment.

## Route Groups for Layout Isolation

A folder name wrapped in parentheses creates a **route group** — a folder that affects layout and file organization but does NOT appear in the URL. Use route groups to give different sections of the app different layouts without polluting URLs.

```
app/
  (auth)/                 # group — does NOT appear in URL
    layout.tsx            # auth layout (no sidebar)
    login/page.tsx        # → /login
    signup/page.tsx       # → /signup
  (app)/                  # group — does NOT appear in URL
    layout.tsx            # app layout (with sidebar)
    dashboard/page.tsx    # → /dashboard
    posts/page.tsx        # → /posts
```

`(auth)/login/page.tsx` resolves to `/login`, not `/(auth)/login`. The grouping is purely organizational on the file system.

## When to Add 'use client'

A component must carry `'use client'` at the top of its `.tsx` file when it uses any of:

- **State hooks:** `useState`, `useReducer`, `useRef`, `useContext`.
- **Effect hooks:** `useEffect`, `useLayoutEffect`.
- **Event handlers attached to DOM:** `onClick`, `onChange`, `onSubmit`, `onKeyDown`.
- **Browser APIs:** `window`, `document`, `localStorage`, `IntersectionObserver`.
- **Third-party client-only libraries.**

A component does NOT need `'use client'` when it only:

- Awaits data via `async`/`await` (RSC).
- Renders conditional JSX based on props.
- Uses `<form action={serverAction}>` to wire a Server Action without client-side state.

**Push `'use client'` boundaries as far down the tree as possible.** A page should stay RSC; only the leaf component(s) that genuinely need interactivity should be marked client. See [component-decomposition.md](./component-decomposition.md) for the decomposition decisions this implies, and [../rules/rsc-vs-client.md](../rules/rsc-vs-client.md) for the full client-trigger list.

## Focused, Domain-Named Hooks (No Monolithic Logic Hook)

When a `'use client'` component requires logic, use **multiple focused, domain-named hooks** — `useLoginForm`, `useAuth`, `useOAuthLogin` — NOT a single monolithic hook that owns every concern in the page.

### Rationale

- **Server Components do not need a logic hook at all.** `async`/`await` at the component level is sufficient. Most pages are server-rendered; the question of "what hook owns this page's logic?" simply does not arise for them.
- **`'use client'` components in App Router are typically narrower in scope than full pages.** A single monolithic hook is an over-generalization for what is usually a single-concern client island (a form, a modal, a dropdown). The component's name already declares its concern; a hook with the same scope just doubles the indirection.
- **Server Actions move much of the mutation logic to the server.** What used to be "client-side login orchestration" — submit handling, error mapping, navigation — is now "form submit → Server Action → redirect." There is far less client-side state left to extract into a single hook.
- **Domain-named hooks compose and reuse.** `useAuth` is consumed by login, signup, password-reset, and the profile menu. A monolithic page-scope hook is single-use, harder to test, and bloats with every variant added by a new caller.

### Example — Focused Hooks in a Login Form

```typescript
// features/auth/components/LoginForm/LoginForm.tsx
'use client'

import { useLoginForm } from '@features/auth/hooks/useLoginForm'
import { useAuth } from '@features/auth/hooks/useAuth'

export function LoginForm() {
  const { isAuthenticated } = useAuth()                  // session state
  const { form, onSubmit, isPending } = useLoginForm()   // form state + submission

  if (isAuthenticated) return <p>Already signed in</p>

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <input {...form.register('email')} className="rounded-card border px-3 py-2" />
      <input {...form.register('password')} type="password" className="rounded-card border px-3 py-2" />
      <button type="submit" disabled={isPending} className="rounded-card bg-brand-500 px-4 py-2 text-white">
        Sign in
      </button>
    </form>
  )
}
```

Two hooks, two concerns. `useAuth` answers "is the user signed in?" and is consumed everywhere session state matters. `useLoginForm` owns the form lifecycle and is consumed only here. Both follow the typing discipline in [custom-hook-typing.md](./custom-hook-typing.md):

```
features/auth/hooks/
  useAuth/
    useAuth.ts
    types.ts
    index.ts
  useLoginForm/
    useLoginForm.ts
    types.ts
    index.ts
```

### Anti-Pattern — Forbidden

A single hook that owns form state plus auth state plus OAuth state plus navigation plus error handling, named after the page rather than after a domain concern. Pattern names like `useLoginPageLogic` or `useLoginScreenLogic` are rejected — the unit of cohesion is the **domain concern**, not the **page**. If the same orchestration recurs across pages, that is a sign the concerns should be factored into focused hooks each page composes — not consolidated into a bigger page-scoped hook.

## loading.tsx and error.tsx Siblings

A `loading.tsx` co-located with `page.tsx` is auto-wrapped in `<Suspense>` by App Router. An `error.tsx` co-located with `page.tsx` is auto-wrapped in a React Error Boundary. Both are layered onto the page transparently — the page does not import them; the framework wires them.

When to add `loading.tsx` versus an explicit `<Suspense>` inside the page tree: see [loading.md](./loading.md). When to add `error.tsx` at the leaf segment versus letting errors bubble to a parent layout's boundary: see [error-boundary.md](./error-boundary.md).

## Code Sample — RSC Page with 'use client' Island

A canonical composition: an RSC page fetches its data, renders RSC children, and embeds a small client island for the one piece of interactivity it needs.

```typescript
// app/posts/[id]/page.tsx — RSC
import { getPostById } from '@features/posts/queries'
import { PostBody } from '@features/posts/components/PostBody'
import { LikeButton } from '@features/posts/components/LikeButton'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PostPage({ params }: Props) {
  const { id } = await params
  const post = await getPostById(id)

  return (
    <article className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-3xl font-semibold">{post.title}</h1>
      <PostBody body={post.body} />
      <LikeButton postId={post.id} initialCount={post.likeCount} />
    </article>
  )
}
```

```typescript
// features/posts/components/LikeButton/LikeButton.tsx
'use client'

import { useLikeButton } from '@features/posts/hooks/useLikeButton'

interface Props {
  postId: string
  initialCount: number
}

export function LikeButton({ postId, initialCount }: Props) {
  const { count, isPending, onLike } = useLikeButton({ postId, initialCount })
  return (
    <button
      onClick={onLike}
      disabled={isPending}
      className="rounded-card bg-brand-500 px-4 py-2 text-white"
    >
      Like ({count})
    </button>
  )
}
```

The page stays RSC, fetches its data, and ships HTML. `PostBody` is also RSC — pure markup transformation. Only `LikeButton` is a client island, and it ships only what it needs to handle the click.

## Cross-References Summary

| Concern | Pattern |
|---|---|
| Component decomposition | [./component-decomposition.md](./component-decomposition.md) |
| Loading states | [./loading.md](./loading.md) |
| Error boundaries | [./error-boundary.md](./error-boundary.md) |
| Server-side data fetch | [./queries-in-rsc.md](./queries-in-rsc.md) |
| Mutations | [./server-actions.md](./server-actions.md) |
| Custom hook typing | [./custom-hook-typing.md](./custom-hook-typing.md) |
