# Environment Validation

Every environment variable consumed by the application flows through `src/env.ts`, validated by Zod (e.g. via `@t3-oss/env-nextjs` on Next.js). Raw `process.env.X` access at call sites is forbidden — missing or malformed env values cause a startup-time error rather than a runtime surprise hidden behind a code path that rarely executes.

## src/env.ts — The Single Source of Truth

`src/env.ts` declares every env variable the application needs, validates each against a Zod schema, and exports a fully-typed `env` object. Every consumer imports from `src/env.ts`; nothing else reads `process.env` directly.

```typescript
// src/env.ts
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    AUTH_SECRET: z.string().min(32),
    STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.string().url(),
    NEXT_PUBLIC_GA_ID: z.string().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  },
})
```

The exported `env` object has fully-inferred types from the Zod schemas. Autocomplete works, type errors flag missing keys, and the runtime guarantees every value matches its schema or the app does not start.

## createEnv Schema Shape

`createEnv` takes three blocks: `server`, `client`, and `runtimeEnv`. Each plays a different role.

### server keys

Variables available only on the server — Server Components, Server Actions, route handlers. They NEVER ship to the client bundle. `@t3-oss/env-nextjs` enforces this at build time: accessing a server key from a `'use client'` file is a build-time error.

Use `server` for anything sensitive (database URLs, API secrets, signing keys, third-party API keys without a public counterpart). The bundler's tree-shaking will not protect a server secret accidentally referenced from a client component; the env validator does.

### client keys

Variables available on both server and client. MUST be prefixed `NEXT_PUBLIC_` (Next.js convention; `@t3-oss/env-nextjs` enforces). Anything in this block ships to the browser.

Use `client` for genuinely public values: a public API base URL, an analytics ID, a feature flag visible to the front end. Never put secrets here.

### runtimeEnv block

An explicit listing of every key, mapping it to its `process.env.X` source. Required by Next.js because `process.env.X` access at module-eval time can be tree-shaken or replaced statically; the explicit listing guarantees the runtime can read each key. Repeat every key from `server` and `client`.

## NEXT_PUBLIC_ Prefix Convention

The `NEXT_PUBLIC_` prefix is enforced by Next.js itself: any env variable consumed in `'use client'` components or in code that ships to the browser must start with this prefix. Without it, the variable is undefined at runtime in client code.

- ✅ `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_FEATURE_FLAG_X` — visible to client code.
- ✅ `DATABASE_URL`, `AUTH_SECRET`, `STRIPE_SECRET_KEY` — server-only.

The prefix is not a security boundary by itself — anything you put behind `NEXT_PUBLIC_` ships to every visitor's browser. The boundary is the `server` vs `client` split in `createEnv`; the prefix is how Next.js recognizes the client-visible subset. `@t3-oss/env-nextjs` enforces both at build time.

## Consuming env at Call Sites

Every call site imports `env` from `@/env`. Raw `process.env.X` access elsewhere is forbidden.

```typescript
// WRONG — untyped, possibly undefined, no validation
const apiUrl = process.env.NEXT_PUBLIC_API_URL
fetch(`${apiUrl}/posts`)
```

```typescript
// CORRECT — typed, validated, never undefined
import { env } from '@/env'

fetch(`${env.NEXT_PUBLIC_API_URL}/posts`)
```

The imported `env` object has fully-inferred types from the Zod schemas. Autocomplete shows every available key. A typo (`env.NEXT_PUBLI_API_URL`) is caught by the type checker. A missing variable in the deployment environment fails at startup, not on the user's first request.

## Startup-Time Validation

When the application starts (or a build runs), `createEnv` parses every key in `runtimeEnv` against the corresponding Zod schema. The behavior:

- **Missing required keys** → throws with a descriptive error listing every missing or malformed key.
- **Malformed keys** (wrong shape — non-URL where URL expected, too-short string where minimum length required) → same error path.
- **Build fails fast.** A misconfigured env never deploys. There is no "the app builds but breaks under load" failure mode for env errors.

Bring up a new environment by setting every required variable before the first build. The validator's error message is the checklist.

See [utils-and-environment.md](./utils-and-environment.md) for the broader rule that no helper file may read `process.env` directly. See [queries-in-rsc.md](./queries-in-rsc.md) and [server-actions.md](./server-actions.md) for canonical server-side consumption of env values inside data-layer code.
