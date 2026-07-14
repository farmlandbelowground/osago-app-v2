---
paths: ["src/features/**/api/**", "src/shared/api/**", "src/features/**/queries.ts", "src/features/**/actions.ts"]
---

# API Rules

## Native `fetch` — Sole HTTP Client

Use native `fetch` everywhere — in Server Components, in Server Actions, in route handlers, and in client-side query hooks. Avoid layering a third-party HTTP client on top; native `fetch` already integrates with framework-level caching.

```typescript
// ✅ CORRECT — native fetch
const response = await fetch(`${env.API_URL}/users/${id}`, {
  headers: { Authorization: `Bearer ${token}` },
  next: { revalidate: 60 },
})
```

```typescript
// ❌ FORBIDDEN — third-party HTTP client layered on top for no reason
import { httpClient } from 'some-http-lib'

const response = await httpClient.get(`/users/${id}`)
```

Native `fetch` integrates with Next.js caching directives (`cache: 'force-cache' | 'no-store'`, `next: { revalidate: N, tags: [...] }`). Choosing the right caching mode is part of the calling code's contract — see [Data Fetching Rules](./data-fetching.md) for the decision tree.

## Zod Validation at Every Boundary

The wire format is untyped at runtime — the TypeScript compiler trusts whatever you cast to, but the network does not. Every response that crosses the boundary into typed code MUST be validated with a Zod schema before the calling code reads any field.

### Schema-First

Define the schema first; derive the type from it. The schema is the source of truth — never hand-write a TypeScript interface that "should match" a server response.

```typescript
// ✅ CORRECT — schema is the source of truth
import { z } from 'zod'

export const UserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'user', 'guest']),
  createdAt: z.iso.datetime(),
})

export type User = z.infer<typeof UserSchema>
```

```typescript
// ❌ FORBIDDEN — hand-written interface drifting from schema
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'guest'
  createdAt: string
}
```

> **Zod 4 — top-level string formats.** Use the top-level format helpers — `z.email()`, `z.uuid()`, `z.url()`, `z.iso.datetime()` — not the chained `z.string().email()` / `.uuid()` / `.datetime()` forms. Zod 4 moved string formats to the top-level `z` namespace and **deprecated the chained forms** (they still run but warn, and a future major drops them). Length / content checks that are not formats stay on `z.string()` — e.g. `z.string().min(1)`. Customize a message with the unified `error` param or its string shorthand: `z.email('Enter a valid email')` or `z.email({ error: 'Enter a valid email' })` (the old `message` param is deprecated in favor of `error`).

### Parse on Receive

Wrap `await response.json()` with `Schema.safeParse(...)` (returns a discriminated result) or `Schema.parse(...)` (throws on mismatch). Never assign raw JSON to a typed variable.

```typescript
// ❌ FORBIDDEN — TypeScript trusts the assertion; runtime might disagree
const user: User = await response.json()
//                  ^^^^^^^^^^^^^^^^^^^^^^^^ untyped at runtime; schema drift goes undetected

// ✅ CORRECT — safeParse for callers that handle errors as data
const result = UserSchema.safeParse(await response.json())

if (!result.success) {
  return { data: null, error: 'Invalid response shape' }
}

const user = result.data

// ✅ CORRECT — parse when an unhandled exception is the right behaviour
//             (e.g. inside a Server Component where an error boundary will catch it)
const user = UserSchema.parse(await response.json())
```

`safeParse` is the default at API boundaries — converting validation failure into a typed result keeps error handling explicit. `parse` is appropriate where the framework intercepts thrown errors via an error boundary and you have nothing meaningful to do at the call site.

## Request Helper Pattern

A thin wrapper at `src/shared/api/fetcher.ts` centralizes base URL, common headers, and Zod validation. Call sites stay short and consistent.

```typescript
// src/shared/api/fetcher.ts
import { type ZodSchema } from 'zod'

import { env } from '@/env'

export type ApiResult<T> =
  | { data: T; error: null }
  | { data: null; error: string }

interface FetcherInit extends RequestInit {
  schema: ZodSchema<unknown>
}

export const apiFetch = async <T>(
  path: string,
  { schema, headers, ...init }: FetcherInit,
): Promise<ApiResult<T>> => {
  const response = await fetch(`${env.API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })

  if (!response.ok) {
    return { data: null, error: `Request failed: ${response.status}` }
  }

  const result = schema.safeParse(await response.json())

  if (!result.success) {
    return { data: null, error: 'Invalid response shape' }
  }

  return { data: result.data as T, error: null }
}
```

```typescript
// Call site stays clean
import { apiFetch } from '@shared/api/fetcher'

import { UserSchema, type User } from './schema'

export const getCurrentUser = async (): Promise<User | null> => {
  const result = await apiFetch<User>('/me', {
    schema: UserSchema,
    next: { revalidate: 60, tags: ['user'] },
  })

  if (result.error) {
    console.error(result.error)
    return null
  }

  return result.data
}
```

The wrapper does **not** swallow caching directives — Next.js-specific options like `next: { revalidate, tags }` and `cache` pass through `init`. Wrapping the wrapper for caching presets is fine; replacing native `fetch`'s caching contract is not.

## Error Handling

### Discriminated Union Return

For callers that need to branch on success vs failure, return a discriminated union:

```typescript
type Result<T> = { data: T; error: null } | { data: null; error: string }
```

This pattern is symmetric with the Server Actions return shape — the boundary between mutation code and query code uses the same vocabulary. See [Server Actions Rules](./server-actions.md) for the action-side mirror.

```typescript
// ✅ CORRECT — caller handles both branches explicitly
const result = await getUser(id)

if (result.error) {
  return <ErrorBanner message={result.error} />
}

return <UserCard user={result.data} />
```

### When to Throw

Throw only for **unrecoverable** infrastructure failures — network unreachable, malformed `env`, missing secret. Anything that represents a normal business outcome (validation failure, conflict, not-found) is data and returns through the discriminated union.

Inside server-rendered code, throwing **is** acceptable when a framework-level error boundary is the right surface for the failure (e.g. a critical query whose absence makes the page meaningless). The caller's reaction is what determines whether throw or return is appropriate, not the layer.

## Environment Variables — `src/env.ts` Only

Every URL, API key, feature flag, and secret flows through `src/env.ts` — a Zod-validated barrel. Direct `process.env.X` access at call sites is forbidden.

```typescript
// ❌ FORBIDDEN — raw process.env at call site
const response = await fetch(`${process.env.API_URL}/users/${id}`)
//                            ^^^^^^^^^^^^^^^^^^^^ untyped, unvalidated, missing-key crashes happen at runtime

// ✅ CORRECT — env barrel
import { env } from '@/env'

const response = await fetch(`${env.API_URL}/users/${id}`)
```

The env barrel is built once at app startup; missing or malformed values fail fast with a descriptive message instead of producing an `undefined` template-literal segment that hits the network. Add new env vars to `src/env.ts` schema first, then consume.

## Common Patterns

### GET Requests

`GET` requests in the read-at-render-time path live in `src/features/<name>/queries.ts`, called from a server-rendered page. Caching strategy is selected per query — see [Data Fetching Rules](./data-fetching.md).

### POST / PUT / DELETE Requests

Mutations live in `src/features/<name>/actions.ts` as Server Actions — never as direct `fetch` calls from a client component. The Server Action validates input with Zod, performs the mutation, and invalidates affected caches. See [Server Actions Rules](./server-actions.md) for the full pattern.

### Constants for Endpoints, Tags, and Keys

Endpoint paths, cache tags, and query-key strings live in [`constants.ts`](./constants.md) at the appropriate scope (feature-local for one feature's endpoints; `@shared/constants/api.ts` for cross-cutting tags). The schema, the type, and the request helper compose around those constants — never hard-code the same path string in three files.

```typescript
// src/features/users/constants.ts
export const USER_TAG = 'user'
export const USERS_ENDPOINT = '/users'

// src/features/users/queries.ts
import { USER_TAG, USERS_ENDPOINT } from './constants'

export const getUserById = async (id: string): Promise<User | null> => {
  const result = await apiFetch<User>(`${USERS_ENDPOINT}/${id}`, {
    schema: UserSchema,
    next: { tags: [USER_TAG] },
  })
  return result.error ? null : result.data
}
```

For the typing of helpers, results, and request payloads, follow [Typing Rules](./typing.md) — interfaces for object shapes, types for unions and Zod-derived shapes.
