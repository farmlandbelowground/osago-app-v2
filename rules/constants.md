---
paths: ["**/constants.ts"]
---

# Constants Rules

## Hard Rule — No Module-Level Constants Inside Component / Helper Files

**Never** declare a module-level `const` at the top of a `.tsx` or helper `.ts` file — including **derived** constants composed from other imports. Every logic-facing literal and every value derived from such literals lives in a sibling `constants.ts`.

```typescript
// ❌ FORBIDDEN — raw literal at top of component
// LoginForm.tsx
const MAX_PASSWORD_LENGTH = 128

export const LoginForm: FC = () => { /* ... */ }

// ❌ FORBIDDEN — raw literal at top of helper
// formatRelativeDate.ts
const DAYS_PER_WEEK = 7

export const formatRelativeDate = (iso: string): string => { /* ... */ }

// ❌ FORBIDDEN — derived value at top of helper (even though inputs are imported cleanly)
// formatRelativeDate.ts
import { MS_PER_SECOND, SECONDS_PER_MINUTE, MINUTES_PER_HOUR, HOURS_PER_DAY } from './constants'

const MS_PER_DAY =
  MS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY

// ✅ CORRECT — raw literal lives in sibling constants.ts
// LoginForm/constants.ts
export const MAX_PASSWORD_LENGTH = 128

// LoginForm.tsx
import { MAX_PASSWORD_LENGTH } from './constants'

// ✅ CORRECT — derived value sits next to its source constants
// shared/utils/date/constants.ts
export const MS_PER_SECOND = 1_000
export const SECONDS_PER_MINUTE = 60
export const MINUTES_PER_HOUR = 60
export const HOURS_PER_DAY = 24

export const MS_PER_DAY =
  MS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY

// formatRelativeDate.ts — one import, no recomposition
import { MS_PER_DAY } from './constants'
```

**Covers:** numeric thresholds, duration/time constants, derived time constants, array sizes, max-item limits, query-key strings, polling intervals — anything typed at the top of a file before the default or named export.

**Why derived values are included:** if the derivation lives in the helper file, every other consumer has to re-import the building blocks and re-compute. Placing the derived value in `constants.ts` gives every consumer a single import and guarantees the composite is defined once.

**Acceptable non-constant top-of-file declarations:** pure helper functions extracted per the component-decomposition principle, `interface`/`type` declarations used only in the file, the `'use client'` directive. The rule targets literal values and their compositions specifically.

## What Belongs in `constants.ts`

Extract literal values into a sibling `constants.ts` when they are used in **logic, hooks, JSX props, or configuration** — not when they exist only to satisfy a styling class.

### Logic-Facing — YES

- **Thresholds and limits** — `MAX_RETRIES`, `MIN_PASSWORD_LENGTH`, `MAX_FILE_SIZE_BYTES`
- **Durations and intervals** — `POLL_INTERVAL_MS`, `DEBOUNCE_DELAY_MS`, `SESSION_TIMEOUT_MS`
- **String identifiers used in logic** — `QUERY_KEY_USER`, `STORAGE_KEY_THEME`, `EVENT_NAME_LOGIN`
- **Configuration objects and option arrays** — tab definitions, dropdown options, feature flags consumed by logic
- **Static data arrays** — list of supported locales, role definitions, status enums via `as const`
- **Cross-feature shared values** — anything imported by two or more features

### Style — NO

Style values do **not** live in `constants.ts`. Spacing, color, typography, radius, shadow, and z-index are styling concerns and belong in CSS (`src/app/globals.css` and its `:root` custom properties), not in a constants file.

```typescript
// ❌ FORBIDDEN — color hex in constants.ts (CSS handles colors)
export const PRIMARY_COLOR = '#3B82F6'

// ❌ FORBIDDEN — spacing value in constants.ts (CSS handles spacing)
export const CARD_PADDING = 16

// ❌ FORBIDDEN — z-index in constants.ts (CSS handles stacking)
export const MODAL_Z_INDEX = 1_000

// ✅ CORRECT — logic-facing limit lives in constants.ts
export const POLL_INTERVAL_MS = 5_000
export const MAX_RETRY_ATTEMPTS = 3
export const QUERY_KEY_USER = 'user'
```

If a numeric value participates in **both** logic and styling — e.g. an icon size used as a `size` prop on an icon component AND mirrored in a styling class — keep it as a logic constant and apply the matching utility separately. Mixed style/logic values are rare; when in doubt, treat the value as logic.

## Naming Conventions

All constants use `UPPER_SNAKE_CASE` — both primitives and objects/arrays:

```typescript
// Primitive constants
export const POLL_INTERVAL_MS = 5_000
export const MAX_RETRY_ATTEMPTS = 3
export const MIN_PASSWORD_LENGTH = 8
export const QUERY_KEY_USER = 'user'

// Object maps
export const ROLES = {
  Admin: 'admin',
  User: 'user',
  Guest: 'guest',
} as const satisfies Record<string, string>

// Static data arrays
export const SUPPORTED_LOCALES = ['en', 'fr', 'es', 'de'] as const
```

Use numeric separators (`5_000`, `1_000_000`) for large numbers — they read clearly and most linters accept them.

## Typed Constants

Use `as const` (and where useful, `satisfies`) when the constant doubles as a type source.

### `as const` Pattern

```typescript
// ✅ CORRECT — readonly tuple, derive a union type
export const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered'] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]
//   ^? 'pending' | 'paid' | 'shipped' | 'delivered'
```

### `as const satisfies` Pattern

`satisfies` validates that the literal matches a target shape **without widening** the inferred type, so derived types stay precise:

```typescript
// ✅ CORRECT — precise types preserved, shape validated
export const ROLES = {
  Admin: 'admin',
  User: 'user',
  Guest: 'guest',
} as const satisfies Record<string, string>

export type Role = (typeof ROLES)[keyof typeof ROLES]
//   ^? 'admin' | 'user' | 'guest'
```

### Discriminated Constants

For static data arrays where each item has multiple fields, declare an explicit type and apply it to the array:

```typescript
interface NavItem {
  href: string
  icon: ComponentType
  label: string
}

export const PRIMARY_NAV: readonly NavItem[] = [
  { href: '/dashboard', icon: DashboardIcon, label: 'Dashboard' },
  { href: '/orders', icon: OrdersIcon, label: 'Orders' },
  { href: '/settings', icon: SettingsIcon, label: 'Settings' },
] as const
```

## Scope and Placement

| Scope | Location | When to use |
|-------|----------|-------------|
| **Component-local** | `<Component>/constants.ts` | Used only by this component and its co-located hooks |
| **Feature-level** | `src/features/<name>/constants.ts` | Shared across multiple components or hooks within one feature |
| **Cross-feature** | `src/shared/constants.ts` or `src/shared/constants/<topic>.ts` | Imported by two or more features, or by the env / API layer |

Start local. Promote to a wider scope only when a second consumer appears — premature hoisting creates indirection without benefit.

```typescript
// ✅ CORRECT — feature-local
// src/features/auth/constants.ts
export const SESSION_TIMEOUT_MS = 30 * 60 * 1_000
export const MAX_LOGIN_ATTEMPTS = 5

// ✅ CORRECT — cross-feature
// src/shared/constants/api.ts
export const REQUEST_TIMEOUT_MS = 12_000
export const DEFAULT_PAGE_SIZE = 20

// ❌ FORBIDDEN — one feature importing another feature's constants
// src/features/dashboard/hooks/useRefreshPolicy.ts
import { SESSION_TIMEOUT_MS } from '@features/auth/constants'
```

When two features need the same constant, promote it to `@shared/constants/...` — features should never reach into each other's internals. See [Import Rules](./imports.md) for the cross-feature import boundary.

## Importing Constants

Inside the same component or feature, use relative imports:

```typescript
// LoginForm.tsx
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from './constants'

// LoginForm/hooks/useLoginValidation.ts
import { MAX_PASSWORD_LENGTH } from '../constants'
```

For shared constants, use the `@shared/*` alias:

```typescript
import { REQUEST_TIMEOUT_MS } from '@shared/constants/api'
```

For typed constants used as type sources, the same alias rules apply — see [Typing Rules](./typing.md) for the type-import convention.

## Linting Behavior

If you enable path-specific lint rules, relax `padding-line-between-statements` for `**/constants.ts` — consecutive `export` statements don't need blank lines between them. Compact constant blocks are encouraged:

```typescript
// ✅ CORRECT — consecutive exports without blank lines
export const POLL_INTERVAL_MS = 5_000
export const MAX_RETRY_ATTEMPTS = 3
export const QUERY_KEY_USER = 'user'
export const QUERY_KEY_ORDERS = 'orders'
```

Also disable `no-magic-numbers` inside `**/constants.ts` and config files — that's the entire point of the file.
