# Directory Structure

A Next.js App Router project follows a strict directory layout. The `app/` directory is the routing manifest; `src/features/` holds feature modules; `src/shared/` holds cross-cutting resources; `src/env.ts` validates environment variables; `public/` holds static assets.

## Top-Level Layout

```
project-root/
  app/                    # App Router file-based routing
  src/
    features/             # feature modules (auth/, posts/, profile/)
    shared/               # cross-cutting components, hooks, utils, types
    env.ts                # validated env (e.g. via @t3-oss/env-nextjs)
  public/                 # static assets (favicon, OG images, robots.txt)
  next.config.ts
  tsconfig.json
  package.json
```

The split between `app/` (routing manifest) and `src/` (implementation) is deliberate. The `app/` directory holds only what the framework needs to wire URLs to UI: page files, layout files, error and loading siblings, route handlers. Business logic, queries, mutations, components, hooks, stores, and types all live under `src/` and are imported into `app/` files via path aliases.

## app/ — Routing Manifest (App Router)

Use the App Router exclusively. Do not create a legacy `pages/` directory alongside it.

### File Conventions

| File | Purpose |
|---|---|
| `page.tsx` | Renders a route's primary content (RSC by default) |
| `layout.tsx` | Persistent UI wrapping children for a segment |
| `loading.tsx` | Auto-`<Suspense>` boundary for the segment (see [loading.md](./loading.md)) |
| `error.tsx` | Auto-error-boundary for the segment (see [error-boundary.md](./error-boundary.md)) |
| `not-found.tsx` | Renders when `notFound()` is thrown in the segment |
| `route.ts` | HTTP route handler |
| `template.tsx` | Like layout but re-mounts on navigation (rare) |

See [page-and-layout.md](./page-and-layout.md) for the canonical anatomy of a `page.tsx` and `layout.tsx`.

### Route Groups

Wrap a segment name in parentheses to create a **route group** — a folder that affects layout and file organization but does NOT appear in the URL.

```
app/
  (auth)/                 # group — not in URL
    layout.tsx            # auth-only layout (no app sidebar)
    login/page.tsx        # → /login
    signup/page.tsx       # → /signup
  (app)/                  # group — not in URL
    layout.tsx            # app shell layout (sidebar, top bar)
    dashboard/page.tsx    # → /dashboard
    posts/page.tsx        # → /posts
```

Use route groups to give different sections of the app different layouts without polluting URLs.

## src/features/ — Feature Modules

Every feature lives in its own folder under `src/features/`. The folder owns its components, hooks, store, types, queries, and Server Actions.

```
features/auth/
  components/             # feature-owned UI
    LoginForm/            # 'use client' island (see ./component-decomposition.md)
  hooks/                  # focused domain hooks (useAuth, useLoginForm)
  store/                  # raw Zustand store (if any)
  types.ts                # feature types
  queries.ts              # RSC-side data fetch (see ./queries-in-rsc.md)
  actions.ts              # Server Actions (see ./server-actions.md)
  index.ts                # public surface barrel
```

A feature module is the unit of cohesion. Anything used only by `auth/` lives inside `features/auth/`. Promote to `shared/` only when a second feature actually needs it (see [component-decomposition.md](./component-decomposition.md) for the local-vs-shared decision rule).

The colocation of `queries.ts` (server-side reads) and `actions.ts` (server-side mutations) inside the feature folder keeps the data layer next to the UI that consumes it. This is the canonical three-way data-fetching split — see [queries-in-rsc.md](./queries-in-rsc.md), [server-actions.md](./server-actions.md), and the client-reactive opt-in path documented in [hooks-and-query.md](./hooks-and-query.md).

## src/shared/ — Cross-Cutting Resources

```
shared/
  components/             # FLAT — Button, Modal, Toast, Card all live at this level
  hooks/                  # cross-cutting hooks (useDebounce, useMediaQuery)
  utils/                  # pure helpers (cn, formatDate)
  types/                  # cross-cutting types (only when truly cross-feature)
```

### Flat shared/components/

`shared/components/` is **flat**. Every shared component sits at the top level of the folder — there are no `atoms/`, `molecules/`, or `organisms/` tiers. The component name plus folder is the only organization.

```
shared/components/
  Button/
    Button.tsx
    types.ts
    index.ts
  Modal/
    Modal.tsx
    types.ts
    index.ts
  Toast/
    Toast.tsx
    types.ts
    index.ts
```

Hierarchical component tiering creates promotion friction (when does a "molecule" become an "organism"?) without delivering a real organizational benefit at typical team sizes. Flat is faster to navigate and maps cleanly to the way most projects already think about shared UI.

## src/env.ts — Validated Environment

Environment variables flow through a single `src/env.ts` module, ideally validated with Zod (e.g. via `@t3-oss/env-nextjs`). Raw `process.env` access at call sites is forbidden. See [environment-validation.md](./environment-validation.md) for the canonical schema and consumption pattern.

## public/ — Static Assets

Files served directly by URL — favicon, OG images, `robots.txt`, `manifest.json`, downloadable PDFs.

```
public/
  favicon.ico             # → /favicon.ico
  og-default.png          # → /og-default.png
  robots.txt              # → /robots.txt
```

`public/` is NOT an alias target. Files inside it are referenced via absolute web paths (e.g. `<Image src="/og-default.png" ... />`), never imported. The distinction matters: `public/` is for what the browser fetches by URL; `src/shared/assets/` (when present) is for files bundled into the JavaScript output.

## Path Aliases

Path aliases keep imports short and stable across refactors. Configure in `tsconfig.json` and mirror in any tooling that needs to resolve modules (Next.js does this automatically; some test runners and bundlers need explicit configuration).

| Alias | Resolves to | Purpose |
|---|---|---|
| `@/*` | `src/*` | Root fallback (use sparingly — prefer the more specific aliases below) |
| `@features/*` | `src/features/*` | Feature modules |
| `@shared/*` | `src/shared/*` | Cross-cutting shared resources |

Example imports:

```typescript
import { listPosts } from '@features/posts/queries'
import { Button } from '@shared/components/Button'
import { cn } from '@shared/utils/cn'
import { env } from '@/env'
```

The `@/*` alias resolves to `src/*` and exists primarily as the root fallback for files like `env.ts` that sit directly under `src/`. Day-to-day imports should prefer `@features/*` and `@shared/*` for clarity.
