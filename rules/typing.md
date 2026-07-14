# Typing Rules

## `interface` vs `type`

Use `interface` for plain object shapes. Use `type` only when `interface` is insufficient.

### When to Use `interface`

- Component props (custom props that define the component's own fields)
- Hook return types (object shapes)
- Hook argument types (object shapes)
- Any standalone object structure definition

```typescript
// ✅ CORRECT — plain object shape
interface CustomProps {
  isChecked: boolean
  label: ReactNode
  onChange: (value: boolean) => void
  error?: string
}

interface UseLoginFormResult {
  form: UseFormReturn<LoginInput>
  isPending: boolean
  onSubmit: () => void
}
```

### No Nested Inline Object Types

Never define inline object shapes inside an interface. Extract them into separate interfaces:

```typescript
// ❌ WRONG — nested inline object
interface Profile {
  user: {
    name: string
    email: string
    address: {
      city: string
      zip: string
    }
  }
  isLoading: boolean
}

// ✅ CORRECT — flat, separate interfaces
interface Address {
  city: string
  zip: string
}

interface User {
  address: Address
  email: string
  name: string
}

interface Profile {
  isLoading: boolean
  user: User
}
```

This keeps interfaces reusable, readable, and consistent with alphabetical key sorting.

### When to Use `type`

- Intersections with external DOM types (e.g., combining custom props with `HTMLAttributes<HTMLDivElement>`)
- Union types
- Mapped types
- Function signatures (hook type aliases)
- Primitive aliases
- Utility type compositions (`Omit`, `Pick`, `Partial`, etc.)
- Types derived from a Zod schema via `z.infer<typeof Schema>`

```typescript
// ✅ CORRECT — intersection with external DOM type, must be `type`
type Props = CustomProps & HTMLAttributes<HTMLDivElement>

// ✅ CORRECT — union type
type Status = 'idle' | 'loading' | 'success' | 'error'

// ✅ CORRECT — function signature
type UseLogout = () => LogoutResult

// ✅ CORRECT — primitive alias
type IsAuthenticated = boolean

// ✅ CORRECT — utility type composition
type ButtonProps = Omit<HTMLAttributes<HTMLButtonElement>, 'onChange'> & CustomProps

// ✅ CORRECT — derived from Zod schema
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type LoginInput = z.infer<typeof LoginSchema>
```

### Common Pattern: CustomProps + Props

Most components define their own fields in an `interface`, then combine with DOM-element types via `type`. The DOM-generic substitutes for any platform-specific prop types — the underlying HTML element drives the merge.

```typescript
// types.ts
interface CustomProps {
  label: string
  isDisabled?: boolean
  size?: 'small' | 'medium' | 'large'
}

type Props = CustomProps & HTMLAttributes<HTMLButtonElement>
```

Pick the HTML element matching the component's root: `HTMLButtonElement` for buttons, `HTMLInputElement` for inputs, `HTMLAnchorElement` for links, `HTMLDivElement` for generic containers.

## Component Signature: `FC<Props>` or `function` declaration

Two equivalent component-signature forms are permitted; choose per file kind:

| File kind | Permitted signature | Rationale |
|---|---|---|
| **Framework convention files** (Next.js `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `global-error.tsx`, `template.tsx`, `route.ts`) | **`export default function Name({...}: Props) {...}`** | Required by the framework — it discovers these files by default export and calls them as functions |
| **All other components** (flat shared components, feature components, providers) | **Either `export const Name: FC<Props> = ({...}) => {...}` OR `export function Name({...}: Props) {...}`** | Both forms are idiomatic in modern React projects; pick one and stay consistent within a feature. `FC<Props>` carries `children` typing implicitly; `function` declarations have hoisting and clearer stack traces. |

What is NOT permitted in either form:

- Inline destructured-type signatures without a named `Props` interface: `function Foo({ a, b }: { a: string; b: number })` is forbidden — extract to `interface Props {...}` first
- Anonymous default exports without a name: `export default ({...}: Props) => {...}` is forbidden — React DevTools and stack traces become unreadable

### Hooks and providers are NOT components

The `FC<Props>` / `function` choice applies only to **UI components** (anything that returns JSX). Custom hooks (`useFoo`) and providers (`QueryProvider`, `ThemeProvider`) use plain typed function declarations or arrow forms appropriate to their signature; they are not under this rule.

### Framework convention example (Next.js App Router)

```typescript
// app/(app)/posts/[id]/page.tsx
interface Props {
  params: Promise<{ id: string }>
}

export default async function PostPage({ params }: Props) {
  const { id } = await params
  // ...
}
```

For these convention files use the default-export function signature exactly — the standard component-signature rule above resumes for every other component the page composes.

### Standard Components

```typescript
import { type FC } from 'react'

export const Button: FC<Props> = ({ label, isDisabled, onClick }) => {
  // ...
}
```

### Components Without Props

```typescript
export const SkeletonCard: FC = () => {
  // ...
}
```

### Memoized Components

For `memo`-wrapped components, pass the props type as a generic to `memo`:

```typescript
import { memo } from 'react'

// ✅ CORRECT — type in memo generic
export const Checkbox = memo<Props>(({ label, onChange, isChecked, error }) => {
  // ...
})

// ❌ WRONG — inline type annotation on destructuring
export const Checkbox = memo(({ label, onChange, isChecked }: Props) => {
  // ...
})
```

### Components With `children`

For wrapper components, use `PropsWithChildren` or include `children: ReactNode` explicitly:

```typescript
import { type FC, type PropsWithChildren } from 'react'

interface CustomProps {
  variant: 'default' | 'compact'
}

export const Card: FC<PropsWithChildren<CustomProps>> = ({ variant, children }) => {
  // ...
}
```

## TypeScript Strict Mode

Enable `strict: true` along with `noUnusedLocals: true`, `noUnusedParameters: true`, and `noFallthroughCasesInSwitch: true`. Every file is type-checked under these settings — there is no opt-out.

```typescript
// ❌ FORBIDDEN — silencing strict checks per-file
// @ts-ignore
const value: User = await response.json()

// ❌ FORBIDDEN — silencing a single line
// @ts-expect-error - the API response shape changed
const id = response.userId

// ✅ CORRECT — refactor to satisfy strict mode
const result = UserSchema.safeParse(await response.json())

if (!result.success) {
  return { data: null, error: 'Invalid response shape' }
}

const value = result.data
```

`@ts-expect-error` is allowed only as a temporary marker around third-party type definition bugs and must include a comment describing what to verify when the upstream is fixed. `@ts-ignore` is forbidden — it suppresses errors silently even when the underlying issue is gone.

Unused imports, parameters, and locals are errors, not warnings. Prefix intentionally unused parameters with `_`:

```typescript
// ✅ CORRECT — unused param prefixed
const onLayoutChange = (_event: UIEvent, value: number): void => {
  setValue(value)
}
```

## Path Aliases for Types

Type-only imports use the same path aliases as runtime imports — see [Import Rules](./imports.md) for the alias table. Always mark type-only imports with the inline `type` keyword so the compiler can elide them at build time:

```typescript
// ✅ CORRECT — inline type imports tree-shake cleanly
import { type FC, type PropsWithChildren } from 'react'
import { type LoginInput } from '@features/auth/schema'
import { type User } from '@shared/types/user'

// ❌ FORBIDDEN — type and value mixed in one runtime import
import { FC, useState } from 'react'

// ❌ FORBIDDEN — separate `import type` statement when the file also pulls runtime
//                values from the same module; merge them with inline `type` instead
import type { FC } from 'react'
import { useState } from 'react'

// ✅ CORRECT — single merged import with inline `type`
import { type FC, useState } from 'react'
```
