---
paths: ["src/features/**/actions.ts", "src/shared/actions/**"]
---

# Server Actions Rules

## `'use server'` Directive

Server Actions are mutations that run on the server, callable from a `<form action={...}>` prop or invoked directly from a client component as if it were a local function. They are the project's **sole mutation pathway** — write operations do not happen via direct `fetch` from a client component.

### File-Level — Preferred

Place `'use server'` as the **first non-comment line** of `actions.ts`. This marks every exported function in the file as a Server Action.

```typescript
// ✅ CORRECT — file-level directive
// src/features/auth/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export const login = async (
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> => {
  // ...
}
```

### Function-Level — Permitted, Discouraged

Inline `'use server'` inside an async function is permitted by Next.js but rarely the right choice — it scatters mutations across the codebase and obscures the security boundary. Prefer dedicated `actions.ts` files.

```typescript
// ❌ DISCOURAGED — inline directive scatters mutations
export const SomeRSC = async () => {
  async function recordView() {
    'use server'
    // ...
  }
  return <button formAction={recordView}>Track</button>
}

// ✅ CORRECT — extract to actions.ts
// actions.ts
'use server'

export const recordView = async (): Promise<void> => {
  // ...
}
```

## Zod Input Validation — Mandatory

Every Server Action validates its input with Zod before any business logic runs. The wire format is untyped; `formData.get('email')` returns `FormDataEntryValue | null`, not a string. Trusting raw input is the most common Server Action vulnerability.

```typescript
// ❌ FORBIDDEN — raw FormData cast to string, no validation
export const login = async (formData: FormData): Promise<LoginState> => {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // What if email is null? What if it's a File? What if password is empty?
  // The cast lies to the type system; the runtime crashes or worse.
  return signIn(email, password)
}

// ✅ CORRECT — Zod validates before anything else
export const login = async (
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> => {
  const result = LoginSchema.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    return {
      success: false,
      error: 'Please enter a valid email and password.',
    }
  }

  const { email, password } = result.data
  // business logic on validated, typed input
}
```

The same Zod schema validates on the **client** in React Hook Form (via `zodResolver`) and on the **server** in the action — defense in depth, single source of truth. See [Forms Rules](./forms.md) for the client side.

## Error Handling — Return Value, Not Throw

Server Actions return a discriminated union. Business errors are **data**, not exceptions — throwing turns business outcomes into unhandled errors that surface in an error boundary, breaking the form's recovery flow.

### Discriminated Union Return

```typescript
// shared shape across actions
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }
```

```typescript
// ✅ CORRECT — discriminated return
export const updateProfile = async (
  prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> => {
  const result = UpdateProfileSchema.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    return { success: false, error: 'Invalid input.' }
  }

  const apiResult = await updateProfileApi(result.data)

  if (apiResult.error) {
    return { success: false, error: 'Could not save your changes.' }
  }

  revalidatePath('/profile')
  return { success: true, data: apiResult.data }
}
```

### When to Throw — `redirect()` and `notFound()` Only

Two functions throw by design — Next.js intercepts the thrown signal as control flow, not as an error:

- `redirect(path)` from `next/navigation` — sends a server redirect after the action completes
- `notFound()` from `next/navigation` — renders the closest `not-found.tsx`

```typescript
// ✅ CORRECT — redirect throws; let it
import { redirect } from 'next/navigation'

export const login = async (
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> => {
  // ... validation + auth logic ...

  revalidatePath('/dashboard')
  redirect('/dashboard')
  // unreachable; redirect throws
}

// ❌ FORBIDDEN — wrapping redirect in try/catch swallows the navigation signal
try {
  redirect('/dashboard')
} catch (e) {
  return { success: false, error: 'Something went wrong' }
}
```

Anything else thrown becomes an unhandled error that surfaces in the route's error boundary. If the failure should produce a recoverable form state, return it as data.

## Cache Invalidation

Server Actions almost always need to invalidate cached data — without it, the page renders with stale results until the next deploy. Choose `revalidatePath` for route-targeted invalidation and `revalidateTag` for cross-cutting tag-based invalidation.

### `revalidatePath`

```typescript
import { revalidatePath } from 'next/cache'

revalidatePath('/dashboard')      // invalidate one route
revalidatePath('/orders/[id]', 'page') // invalidate dynamic route, all instances
revalidatePath('/', 'layout')     // invalidate root layout (cascades to all routes)
```

### `revalidateTag`

```typescript
import { revalidateTag } from 'next/cache'

// In queries.ts:
const result = await fetch(url, { next: { tags: ['user', `user:${id}`] } })

// In actions.ts after a mutation:
revalidateTag('user')             // invalidates every fetch tagged 'user'
revalidateTag(`user:${id}`)       // invalidates one specific user
```

Use **path** invalidation when the change is route-shaped (this page, that page). Use **tag** invalidation when the change cuts across many pages (any page that fetches `user`). Pair this with [Data Fetching Rules](./data-fetching.md) — tags applied at the fetch site are what makes tag-based invalidation work.

## Redirect on Success

For form submissions that take the user somewhere new on success — login, sign-up, checkout completion — call `redirect(path)` **after** all business logic and cache invalidation. `redirect` throws; nothing after it runs.

```typescript
// ✅ CORRECT — order is: validate → mutate → revalidate → redirect
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export const createOrder = async (
  prevState: OrderState,
  formData: FormData,
): Promise<OrderState> => {
  const parsed = OrderSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { success: false, error: 'Invalid order details.' }
  }

  const result = await createOrderApi(parsed.data)

  if (result.error) {
    return { success: false, error: 'Could not place your order.' }
  }

  revalidatePath('/orders')
  redirect(`/orders/${result.data.id}`)
}
```

## `useActionState` — Client-Side Pending and Error

For forms that don't need React Hook Form, `useActionState` (a React hook) gives client-side `[state, action, isPending]` without ceremony. The action runs server-side; the hook surfaces its return value and a pending flag for UI feedback.

```tsx
// LoginForm.tsx
'use client'

import { useActionState } from 'react'

import { login, type LoginState } from './actions'

const initialState: LoginState = { success: false }

export const LoginForm: FC = () => {
  const [state, formAction, isPending] = useActionState(login, initialState)

  return (
    <form action={formAction}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Signing in...' : 'Sign in'}
      </button>
      {!state.success && state.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}
    </form>
  )
}
```

For complex forms with field-level real-time validation, dependent fields, or controlled inputs, switch to React Hook Form + `zodResolver` calling the same Server Action — see [Forms Rules](./forms.md) for the decision matrix.

## Colocation

Server Actions live next to the feature that owns them:

```
src/features/auth/
  actions.ts        # 'use server' — login, signOut, signUp
  schema.ts         # Zod schemas shared by actions and forms
  queries.ts        # RSC reads
  components/
  hooks/
  store/
  index.ts
```

Cross-feature shared actions (rare) live under `src/shared/actions/<concern>.ts`. Promote only when two features genuinely need the same action.

## Common Mistakes

- **Throwing business errors instead of returning** — the error boundary swallows the failure; the user sees an error page instead of a form with an inline message.
- **Forgetting `revalidatePath` / `revalidateTag`** — the mutation succeeds but the page still shows stale data until next deploy.
- **Skipping Zod validation** — TypeScript erases at runtime; the type assertion lies. Validate or get owned.
- **Business logic directly in `page.tsx`** — a page is a render boundary, not a mutation surface. Extract to `actions.ts`.
- **Awaiting `redirect()` from a client `onSubmit`** — `redirect` throws on the server; the client promise never resolves. The right pattern is to call the action via `<form action>` or `useActionState`, not from a custom `onSubmit` that awaits it.
- **Sharing actions through a default export** — Server Actions must be named exports. Default exports break the RSC reference encoding.

For the API helpers and Zod patterns these actions consume, see [API Rules](./api.md). For the typing of action return values and form state interfaces, see [Typing Rules](./typing.md). For the client-side form layer that drives most actions, see [Forms Rules](./forms.md). For caching strategies that determine which `revalidate*` call to make, see [Data Fetching Rules](./data-fetching.md). For the directive placement and the boundary that decides whether the calling component is RSC or client, see [RSC vs Client Components](./rsc-vs-client.md).
