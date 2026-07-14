# Utils, Helpers & Environment

Pure helper functions are colocated by scope. They never live inside a hook body. Environment access flows through the validated `src/env.ts` module — never raw `process.env` at call sites.

## Pure Helper Functions

A pure helper takes input and returns output without side effects. It does not perform I/O, does not call APIs, does not mutate global state, and does not depend on the surrounding render cycle. Pure helpers are the easiest code to test and the safest to share.

### Never Define Inside Hooks

Defining a pure function inside a hook body re-allocates the function reference every render. The function is impossible to reuse from outside, harder to test, and silently breaks any consumer that depends on referential equality (memoization, dependency arrays).

```typescript
// WRONG — formatTimer redeclared every render
export const useCountdown = (target: number) => {
  const [now, setNow] = useState(Date.now())

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return formatTimer(Math.max(0, target - now))
}
```

```typescript
// CORRECT — formatTimer extracted to utils
// hooks/useCountdown/utils.ts
export const formatTimer = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// hooks/useCountdown/useCountdown.ts
import { formatTimer } from './utils'

export const useCountdown = (target: number) => {
  const [now, setNow] = useState(Date.now())
  return formatTimer(Math.max(0, target - now))
}
```

The helper is now reusable, testable in isolation, and stable across renders.

### Single-Responsibility Discipline

One exported function per concern. Resist "kitchen-sink" utility files like `helpers.ts` that grow over time into a junkyard. Split by topic: `formatters.ts`, `validators.ts`, `urlBuilders.ts`. A reader scanning the file should be able to predict what is in it from the file name alone.

### No Side Effects

Pure helpers do not call APIs, do not write to `localStorage`, do not log to analytics, do not mutate parameters. Side-effecting code belongs in hooks (for client-side effects), Server Actions (for server-side effects), or queries (for server-side reads). Conflating side-effecting code with pure helpers makes both harder to test and reason about.

## Scope Decision Table

Helpers are colocated at the narrowest scope that accommodates every consumer. Start local; promote outward when a second consumer appears.

| Scope | Location | When |
|---|---|---|
| **Component-local** | `<ComponentName>/utils.ts` | Used only by this component or its hooks |
| **Hook-local** | `useHookName/utils.ts` | Used only by this hook |
| **Feature-level** | `features/<name>/utils.ts` or `features/<name>/utils/<topic>.ts` | Shared within the feature |
| **Shared** | `@shared/utils/` (flat or thematic subfiles like `formatters.ts`, `validators.ts`) | Cross-feature |

Promotion path: start local. When a second consumer inside the same feature appears, lift to feature-level. When a second feature needs it, lift to `@shared/utils/`. Never start at shared — speculative shared utilities accumulate optional parameters as each new caller pulls in slightly different requirements, and they age into untestable knots.

A web-relevant hook-utils example: parsing route filters from `useSearchParams`. The parsing is a pure function — input is `URLSearchParams`, output is a typed shape — so it belongs in a sibling `utils.ts`, not in the hook body.

```typescript
// hooks/useFilters/utils.ts
export interface ParsedFilters {
  q: string
  page: number
  sort: 'asc' | 'desc'
}

export const parseFilters = (params: URLSearchParams): ParsedFilters => ({
  q: params.get('q') ?? '',
  page: Number(params.get('page') ?? '1'),
  sort: params.get('sort') === 'desc' ? 'desc' : 'asc',
})

// hooks/useFilters/useFilters.ts
import { useSearchParams } from 'next/navigation'
import { parseFilters } from './utils'

export const useFilters = () => {
  const params = useSearchParams()
  return parseFilters(new URLSearchParams(params.toString()))
}
```

The parser is testable without a React tree. The hook stays small and focused on what it can only do as a hook (consume `useSearchParams`).

## Barrel File Discipline

Barrel files (`index.ts`) re-export the public surface of a folder. Keep them narrow and targeted; wide barrels defeat tree-shaking and inflate bundle size.

- ❌ A single `@shared/index.ts` re-exporting components, hooks, utils, and types in one file. Bundlers cannot drop unused branches reliably.
- ✅ Targeted barrels — one per folder: `@shared/utils/index.ts`, `@shared/components/index.ts`, `@shared/hooks/index.ts`, `@shared/types/index.ts`.

Inside `@shared/utils/`, the barrel lists only the public helpers; private helpers used inside the folder stay un-exported. Treat the barrel as documentation: a reader scanning `index.ts` should see exactly the public surface.

```typescript
// shared/utils/index.ts
export { cn } from './cn'
export { formatDate, formatRelativeDate } from './formatters'
export { isEmail, isUrl } from './validators'
```

## Environment Access — src/env.ts Only

All environment values flow from `src/env.ts`, validated by Zod (e.g. via `@t3-oss/env-nextjs`). Utility files MUST NOT contain raw `process.env.X` access — utilities either receive env values as parameters from their caller, or import `env` from `@/env` directly.

```typescript
// WRONG — utility reads process.env directly
export const buildApiUrl = (path: string) => {
  return `${process.env.API_URL}/${path}`
}
```

```typescript
// CORRECT — option A — caller reads env, passes value
// shared/utils/buildApiUrl.ts
export const buildApiUrl = (baseUrl: string, path: string) => {
  return `${baseUrl}/${path}`
}

// caller
import { env } from '@/env'
import { buildApiUrl } from '@shared/utils/buildApiUrl'

const url = buildApiUrl(env.API_URL, '/posts')
```

```typescript
// CORRECT — option B — utility imports env
import { env } from '@/env'

export const buildApiUrl = (path: string) => {
  return `${env.API_URL}/${path}`
}
```

Option A is preferred when the utility might be reused with different base URLs or in tests. Option B is acceptable when the utility is genuinely tied to the validated env and would never be called with a different URL.

The forbidden pattern is `process.env.X` anywhere outside `src/env.ts`. The validated env catches missing keys at startup; raw access defers the failure to runtime, possibly behind a code path that is rarely executed.

See [environment-validation.md](./environment-validation.md) for the full validation pattern, the schema shape, and the `NEXT_PUBLIC_` prefix convention. See [directory-structure.md](./directory-structure.md) for where `src/env.ts` sits in the project layout.
