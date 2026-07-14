# Code Style Rules

Formatting, naming, and structural conventions for a TypeScript / Next.js (App Router) codebase, enforced by ESLint (Next.js core-web-vitals + perfectionist + better-tailwindcss + unused-imports + typescript) and Prettier. Adapt the tool-specific bits (ESLint plugin names) if your project uses a different toolchain — the underlying conventions still apply.

## Formatting (Prettier)

| Setting | Value |
|---------|-------|
| Indentation | 2 spaces, no tabs (`tabWidth: 2`) |
| Quotes | Single quotes (`'`), `singleQuote: true` |
| Trailing commas | All (`trailingComma: 'all'`) |
| Semicolons | Never (`semi: false`) |
| Line length | 80 characters (`printWidth: 80`) |
| Line endings | LF |
| Arrow function parens | Avoid for single param: `x => x * 2` (`arrowParens: 'avoid'`) |

```typescript
// ✅ CORRECT — no semi, single quotes, no parens around single arrow param
const greet = name => `Hello, ${name}`

// ❌ FORBIDDEN — semicolons + double quotes + unnecessary parens
const greet = (name) => `Hello, ${name}`;
```

## Braces & Control Flow

**Every `if`, `else`, `for`, `while` block MUST use curly braces** — even for single statements.

```typescript
// ❌ FORBIDDEN — single-line if without braces
if (isLoading) return
if (error) return null
if (!data) console.error('No data')

// ✅ CORRECT — always use braces
if (isLoading) {
  return
}

if (error) {
  return null
}

if (!data) {
  console.error('No data')
}
```

This applies to all control flow — no exceptions:

```typescript
// ❌ FORBIDDEN
for (const item of items) doSomething(item)
while (hasNext) advance()

// ✅ CORRECT
for (const item of items) {
  doSomething(item)
}

while (hasNext) {
  advance()
}
```

## Naming Conventions

| Selector | Format | Examples |
|----------|--------|---------|
| Variables, functions | `strictCamelCase` | `userName`, `fetchData` |
| Components, types, interfaces, enums | `StrictPascalCase` | `LoginPage`, `UseLoginForm`, `AuthStore` |
| Global constants (string/number) | `UPPER_SNAKE_CASE` | `BASE_URL`, `MAX_RETRIES` |
| Enum members | `StrictPascalCase` | `Active`, `PendingReview` |
| Destructured variables | `strictCamelCase` or `StrictPascalCase` | both allowed for flexibility |
| Parameters | `strictCamelCase` | leading `_` allowed for unused |

### Boolean Naming

Boolean variables and properties **must** start with one of these prefixes:

`is`, `are`, `has`, `show`, `with`, `can`, `should`, `no`

```typescript
// ❌ FORBIDDEN
const loading = true
const visible = false
const checked = true

// ✅ CORRECT
const isLoading = true
const isVisible = false
const isChecked = true
```

### Unused Variables

Prefix intentionally unused variables and parameters with `_`. A lint plugin (e.g. `unused-imports`) removes truly unused imports automatically; declared bindings need the underscore convention.

```typescript
const [_first, second] = tuple
const onClick = (_event: MouseEvent): void => { /* ... */ }
```

## Imports

See [Import Rules](./imports.md) for full details on path aliases, ordering, default-vs-named exports, and barrel discipline.

Quick checks a linter can enforce:

- **Sort order** — externals → path-alias imports → relative `./` and `../`
- **No duplicate imports** — all imports from the same source must be in one statement
- **No circular dependencies**
- **No extraneous dependencies** — only import packages listed in `package.json`
- **Named exports only** — default exports forbidden except in files the framework requires them (e.g. Next.js `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`, `middleware.ts`, `next.config.ts`)

## Spacing & Blank Lines

- **Blank line before:** `return`, `if`, `export`, `function`, `while`, `try`, `throw`, `class`
- **Blank line after:** `if`, `function`, `while`, `export`, `throw`, `class`
- **Const grouping:** consecutive `const`s can be grouped; blank line required after the block before other statements
- **Max 2** consecutive empty lines; 0 at file start; 1 at file end

## Restrictions

### Console

No `console.log`. Use `console.warn`, `console.error`, or `console.debug`:

```typescript
// ❌ FORBIDDEN
console.log('data:', data)

// ✅ CORRECT
console.debug('data:', data)
console.error('Request failed:', error)
```

### Magic Numbers

No magic numbers except: `-1`, `0`, `0.5`, `0.6`, `0.8`, `1`, `2`, `200`. Array indexes and default parameter values are also exempt.

```typescript
// ❌ FORBIDDEN
const timeout = 5000
const columnCount = 3

// ✅ CORRECT
const TIMEOUT_MS = 5_000
const COLUMN_COUNT = 3
```

For everything else, define a named constant — see [Constants Rules](./constants.md).

### Type Safety

- **No `any`** — use `unknown`, proper generics, or specific types
- **No unsafe operations** — assigning, calling, returning, or passing `any`-typed values should all be treated as errors
- **Strict mode is non-negotiable** — see [Typing Rules](./typing.md)

### Promises

- **No floating promises** — every promise must be `await`ed or explicitly voided
- **`void` as statement allowed** — use `void somePromise()` when intentionally not awaiting
- **Async functions must contain at least one `await`** — otherwise they don't need to be async
- **Void-returning callbacks may be async** — needed for handlers like `<form action={serverAction}>`

### Functions

- **Explicit return types** — required on every exported function and on every plain function declared inside a hook
- **Prefer destructuring** — use `const { x } = obj` over `const x = obj.x`
- **No parameter reassignment** — assign to a new variable instead
- **Named function expressions** — avoid anonymous function expressions (generators exempt)

#### Return Types for Plain Functions Inside Hooks

Plain functions declared inside a custom hook **must** carry an explicit return type annotation. `useCallback` previously provided an implicit type via its wrapper — plain functions have no such inference.

**Primitive or `void` → inline annotation:**

```typescript
// ✅ CORRECT
const onClick = (): void => {
  router.push('/dashboard')
}

const getCount = (): number => kidsCount + 1

const isReady = (): boolean => name.trim().length > 0

// ❌ WRONG — missing return type
const onClick = () => {
  router.push('/dashboard')
}
```

**Object shape → extract interface to the hook's `types.ts`:**

```typescript
// hooks/types.ts
export interface StepResult {
  isComplete: boolean
  nextRoute: string
}

// hooks/useOnboardingStep.ts
const buildStep = (): StepResult => ({
  isComplete: isDirty,
  nextRoute: '/onboarding/profile',
})
```

If the same interface is needed by multiple hooks in the same module, promote it to the module's `types/` directory.

### Variables

- **No shadowed variables** — a variable in an inner scope cannot have the same name as one in an outer scope
- **No use before define** — declarations come before references
- **Consistent quote-props** — quote all object keys or none

### Comments

Comment discipline is governed by [Code Comments](./code-comments.md). **Read it in full.** In short: the default is **no comment**; one earns its place only by recording a load-bearing *why* the code cannot carry, in 1–2 sentences; design rationale goes in the PR description, never in code; and no comment ever names an internal task, plan, or process artifact.

Common violations to recognize (every one should have been deleted, not shortened):

- A multi-line narration above a data-fetching function explaining the cache/revalidation strategy — that is decision rationale; it goes in the PR description.
- An essay over a plain type / `interface` explaining why each field exists — the reasoning belongs in the PR, not stapled to the type.
- A process/task reference leaking into a component (`{/* Task 3 wires the filters panel here */}`) — delete it.
- `// mirrors updateProfileAction` / `// per the auth ticket` — cross-referencing narration aimed at a reviewer, not the reader of this file.

If your linter supports it, enable these tooling checks:

- **ESLint-directive comments need descriptions** — `eslint-disable` must include a reason
- **Spell checking** on comments and code (e.g. `@cspell/spellchecker`)

### Interface & Type Key Sorting

Interface keys are sorted alphabetically (ascending, case-insensitive), with **required keys first**:

```typescript
// ✅ CORRECT — required first, then optional, all alphabetical within each group
interface Props {
  label: string
  onChange: (value: string) => void
  error?: string
  isDisabled?: boolean
  size?: 'small' | 'medium' | 'large'
}
```

### Memoization (`useCallback` / `useMemo`)

Only wrap in `useCallback` or `useMemo` when there is a **real benefit**. An empty-dependency memoization still allocates a closure and runs comparison logic — if nothing is gained, it is pure overhead.

**Use `useCallback` only when:**

- The function is passed as a prop to a memoized child component (prevents unnecessary re-renders)
- The function is listed as a dependency of `useEffect`, `useMemo`, or another `useCallback`

**Do NOT use `useCallback` when:**

- The function only calls stable references: `setState` setters, store actions, `router` methods, or other already-stable callbacks
- The dependency array would be empty and the function is never passed as a prop or used as a hook dependency

```typescript
// ❌ UNNECESSARY — setState and router.push are already stable
const onIncrement = useCallback(() => {
  setCount(prev => prev + 1)
}, [])

const onSkip = useCallback(() => {
  setIsOnboardingCompleted(true)
  router.replace('/dashboard')
}, [])

// ✅ CORRECT — plain function, no memoization needed
const onIncrement = (): void => {
  setCount(prev => prev + 1)
}

const onSkip = (): void => {
  setIsOnboardingCompleted(true)
  router.replace('/dashboard')
}

// ✅ CORRECT — useCallback needed: function is a dep of useEffect
const fetchData = useCallback((): void => {
  void refetch()
}, [refetch])

useEffect(() => {
  fetchData()
}, [fetchData])

// ✅ CORRECT — useCallback needed: passed as prop to memoized child
const onSelect = useCallback((id: string): void => {
  setSelectedId(id)
}, [])

return <MemoizedList onSelect={onSelect} />
```

**Use `useMemo` only when:**

- The computation is genuinely expensive (e.g., schema construction, large derived arrays, heavy formatting)
- The memoized value is passed as a prop to a memoized child component

**Do NOT use `useMemo` for:**

- Trivially cheap derivations (`const label = isActive ? 'On' : 'Off'`)
- Values that are not passed as props and do not affect child renders

### No Inline Styles

Inline `style={{ ... }}` is forbidden except for genuinely dynamic values (computed transforms, animation interpolations) that cannot be expressed as utility classes. The full pattern, the `cn()` helper, and the dynamic-only escape hatch live in [Styling Rules](./styling.md).

```tsx
// ❌ FORBIDDEN — static spacing inline
<div style={{ padding: '8px' }}>

// ✅ CORRECT — Tailwind utility
<div className="p-2">
```

## Next.js-Specific

### `'use client'` Directive Placement

`'use client'` is the **first non-comment line** of the file, before all imports. Do not place it after a license header or import block.

```typescript
// ✅ CORRECT — directive at the top
'use client'

import { useState } from 'react'

export const Counter: FC = () => {
  // ...
}

// ❌ FORBIDDEN — directive after imports
import { useState } from 'react'

'use client'

export const Counter: FC = () => {
  // ...
}
```

Use `'use client'` only when the component genuinely needs it — see [RSC vs Client Components](./rsc-vs-client.md) for the trigger list. Reflexively marking every component as client defeats the bundle benefit Server Components provide.

```typescript
interface Props {
  value: string
}

// ❌ UNNECESSARY — pure rendering, no hooks, no event handlers, no browser APIs
'use client'

export const FormattedDate: FC<Props> = ({ value }) => {
  return <span>{new Date(value).toLocaleDateString()}</span>
}

// ✅ CORRECT — no directive; component renders in the server tree
export const FormattedDate: FC<Props> = ({ value }) => {
  return <span>{new Date(value).toLocaleDateString()}</span>
}
```

### Server Component Restrictions

Server Components cannot use React state hooks, effect hooks, browser APIs, or DOM event handlers. Trigger list and the boundary-discipline rule live in [RSC vs Client Components](./rsc-vs-client.md).
