# Import Rules

## Path Aliases

Register a small number of path aliases in `tsconfig.json` `compilerOptions.paths`. Use the most specific alias that covers the import.

### Registered Aliases

| Alias | Resolves to | Purpose |
|-------|-------------|---------|
| `@features/*` | `src/features/*` | Per-feature modules (auth, dashboard, profile, etc.) |
| `@shared/*` | `src/shared/*` | Cross-cutting shared code (components, utils, hooks, types) |
| `@/*` | `src/*` | Root fallback — use only when no more specific alias fits (rare; mostly for `@/env`) |

### Choosing the Right Alias

Always reach for the **most specific** alias. The generic `@/*` is a fallback, not a default.

```typescript
// ❌ FORBIDDEN — generic @/* when a specific alias covers the path
import { Button } from '@/shared/components/Button'
import { useAuth } from '@/features/auth/hooks/useAuth'

// ✅ CORRECT — specific aliases
import { Button } from '@shared/components/Button'
import { useAuth } from '@features/auth/hooks/useAuth'
```

`@/*` is appropriate for files that genuinely live at the `src/` root and have no more specific home — most commonly the env barrel:

```typescript
// ✅ CORRECT — @/env points at src/env.ts (project-wide singleton)
import { env } from '@/env'
```

## Relative Imports

Relative imports (`./`, `../`) are allowed only for files within the **same feature** or within the same route subtree. Cross-feature relative imports are forbidden — use the `@features/*` or `@shared/*` alias instead.

```typescript
// ✅ CORRECT — relative within the same feature
// src/features/auth/components/LoginForm.tsx
import { useLoginForm } from '../hooks/useLoginForm'
import { login } from '../actions'
import { LoginSchema } from '../schema'

// ❌ FORBIDDEN — relative across features
// src/features/dashboard/components/Header.tsx
import { useAuth } from '../../auth/hooks/useAuth'

// ✅ CORRECT — alias across features
import { useAuth } from '@features/auth/hooks/useAuth'
```

Within the routing directory, relative imports between sibling routes are allowed for tightly-coupled route segments (e.g., a layout importing a co-located error boundary). For anything that crosses route subtrees, prefer aliases.

## Import Order

Enforce (e.g. with a lint plugin like `perfectionist`) the following groupings, each separated by a blank line and alphabetized within the group:

1. **External packages** — `react`, `next/*`, `zod`, `zustand`, `react-hook-form`, etc.
2. **Path-alias imports** — `@features/*`, `@shared/*`, `@/*` (most-specific first)
3. **Relative imports** — `./`, `../`

```typescript
// ✅ CORRECT — three groups, blank line between, alphabetical within
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'

import { Button } from '@shared/components/Button'
import { useAuth } from '@features/auth/hooks/useAuth'
import { env } from '@/env'

import { LoginSchema } from './schema'
import { login } from './actions'
```

Let a linter's `--fix` normalize order automatically — write imports in any order as you go and let the formatter sort them.

## Default vs Named Exports

**Named exports only**, with one exception: files the framework requires to be a default export.

```typescript
// ❌ FORBIDDEN — default export in a regular component file
// src/features/auth/components/LoginForm.tsx
export default function LoginForm() {
  // ...
}

// ✅ CORRECT — named export
// src/features/auth/components/LoginForm.tsx
export const LoginForm: FC = () => {
  // ...
}
```

### Files That Must Default-Export (Next.js Convention)

| Path pattern | Exported member |
|--------------|-----------------|
| `app/**/page.tsx` | Page component |
| `app/**/layout.tsx` | Layout component |
| `app/**/loading.tsx` | Loading component |
| `app/**/error.tsx` | Error boundary component |
| `app/**/not-found.tsx` | Not-found component |
| `app/**/global-error.tsx` | Root error boundary component |
| `app/**/template.tsx` | Template component |
| `app/**/route.ts` | One or more named HTTP method functions (`GET`, `POST`, etc.) — these ARE named, not default |
| `next.config.ts` | Config object |
| `middleware.ts` | `middleware` function (named export) |

```typescript
// ✅ CORRECT — Next.js page convention requires default export
// src/app/(auth)/login/page.tsx
export default function LoginPage() {
  return <LoginForm />
}
```

## Barrel Files

### Feature-Level Barrels — Encouraged

Each feature exposes its public surface via a top-level `index.ts`. Internals import from the barrel only when crossing feature boundaries; same-feature files use relative paths.

```typescript
// src/features/auth/index.ts
export { useAuth } from './hooks/useAuth'
export { LoginForm } from './components/LoginForm'
export { login, logout } from './actions'
export type { AuthUser } from './types'

// External consumer (different feature)
import { useAuth } from '@features/auth'

// Internal consumer (same feature)
import { useAuth } from '../hooks/useAuth'
```

### Shared-Level Barrels — Targeted, Never Wide

A shared barrel must scope to one concern. Wide re-exports break tree-shaking — every consumer drags in the whole shared surface even when it imports one symbol.

```typescript
// ✅ CORRECT — targeted barrels by concern
// src/shared/components/index.ts
export { Button } from './Button'
export { Card } from './Card'
export { Input } from './Input'

// src/shared/utils/index.ts
export { cn } from './cn'
export { formatDate } from './formatDate'

// ❌ FORBIDDEN — single wide barrel
// src/shared/index.ts
export * from './components'
export * from './utils'
export * from './hooks'
export * from './types'
```

## React Import (No Explicit Import Needed)

With the automatic JSX runtime (Next.js 13+ / any modern React setup), `import React from 'react'` is unnecessary in component files. Only import the specific hooks, types, or utilities you actually use, and prefix type-only imports with the inline `type` keyword.

```typescript
// ❌ FORBIDDEN — legacy default React import
import React from 'react'

// ❌ FORBIDDEN — unnecessary namespace import
import * as React from 'react'

// ✅ CORRECT — import only what's used; types use inline `type`
import { type FC, useState } from 'react'

export const Counter: FC = () => {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

A lint plugin (e.g. `unused-imports`) removes any leftover `React` import automatically when nothing in the file references it.

For typing-related conventions around imports, see [Code Style Rules](./code-style.md).
