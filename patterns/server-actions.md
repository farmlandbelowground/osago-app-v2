# Server Actions Pattern

Mutations live in feature-colocated `actions.ts` files marked `'use server'`. Each action validates input via Zod, executes business logic, returns a discriminated result, invalidates affected caches via `revalidatePath` or `revalidateTag`, and (for navigation flows) calls `redirect()`. Server Actions are the canonical mutation path — TanStack Query mutations are reserved for client-reactive optimistic-UX flows, not as the default mutation mechanism.

## actions.ts Colocation

Each feature owns its `actions.ts` alongside `queries.ts`. The two files share Zod schemas defined in a sibling `schemas.ts` so client and server validation stay aligned by construction.

```
features/auth/
  actions.ts                  # 'use server' — login, logout, signup
  queries.ts                  # RSC reads — see ./queries-in-rsc.md
  schemas.ts                  # Zod schemas shared between actions and forms
  types.ts
  components/
    LoginForm/                # 'use client' island
```

The `actions.ts` file declares one or more async functions, each invoked by either a `<form action={...}>` prop or programmatically by a client component.

## Anatomy of a Server Action

A canonical action declares the file-level `'use server'` directive, parses input via Zod, executes business logic, and either returns a discriminated result, redirects, or signals not-found.

```typescript
// features/auth/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { env } from '@/env'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type LoginResult =
  | { success: true; data: { userId: string } }
  | { success: false; error: string }

export async function login(
  prevState: LoginResult,
  formData: FormData,
): Promise<LoginResult> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' }
  }

  // ... business logic talks to an upstream service ...
  const userId = 'usr_123'

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
```

The discipline points:

- **File-level `'use server'`.** One directive at the top of the file — preferred over per-function directives. Every export in the file is a Server Action.
- **Zod input parse before any logic.** Trust nothing the client sends. `safeParse` returns a discriminated result; convert validation failures into the action's error path.
- **Discriminated return type.** `LoginResult` is the union `{ success: true; data } | { success: false; error }`. Callers check `result.success` and TypeScript narrows the rest.
- **Errors return values, not throws.** The only throws Server Actions perform are `redirect()` and `notFound()` (special signals Next.js intercepts). Business errors are returned in the discriminated result.
- **Cache invalidation MANDATORY after mutations.** `revalidatePath('/route')` for route-specific invalidation; `revalidateTag('tag-name')` for tag-based invalidation matching tagged fetches in [queries-in-rsc.md](./queries-in-rsc.md).
- **`redirect()` last.** It throws a special signal — call after every business step is complete and after `revalidatePath`/`revalidateTag`. Never inside `try/catch`.

For not-found flows, import `notFound` from `next/navigation` and call it when a resource doesn't exist (e.g. an action that operates on a record id that's been deleted). `notFound()` throws a special signal Next.js intercepts to render the segment's `not-found.tsx`.

## Simple-Form Flow

For a form with no field-level real-time validation, no async field validation, no dependent fields, and no multi-step orchestration, use the `<form action={...}>` prop with `useActionState` for pending state and error handling. No `react-hook-form` needed.

```tsx
// app/login/page.tsx — RSC
import { LoginForm } from '@features/auth/components/LoginForm'

export default function LoginPage() {
  return <LoginForm />
}
```

```tsx
// features/auth/components/LoginForm/LoginForm.tsx
'use client'

import { useActionState } from 'react'
import { login } from '@features/auth/actions'

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, {
    success: false,
    error: '',
  })

  return (
    <form action={formAction} className="space-y-4">
      <input name="email" type="email" required className="rounded-card border px-3 py-2" />
      <input name="password" type="password" required className="rounded-card border px-3 py-2" />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-card bg-brand-500 px-4 py-2 text-white"
      >
        {isPending ? 'Signing in...' : 'Sign in'}
      </button>
      {!state.success && state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
    </form>
  )
}
```

Use this flow when:

- The form is one-shot submit with no field-level validation feedback before submit.
- No dependent fields (changing field A does not enable/disable field B).
- No async field validation (e.g. checking username availability while typing).
- No multi-step wizard.

The simple flow is shorter, has no extra dependency, and integrates cleanly with the action's discriminated result.

## Complex-Form Flow

For forms with field-level real-time validation, async field validation, dependent fields, or multi-step flows, pair `react-hook-form` with `zodResolver` on the client and call the Server Action from `handleSubmit`. The same Zod schema validates both sides — client for UX, server for trust.

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoginSchema, type LoginInput } from '@features/auth/schemas'
import { login } from '@features/auth/actions'

const initialState = { success: false, error: '' } as const

function toFormData(input: LoginInput): FormData {
  const fd = new FormData()
  Object.entries(input).forEach(([k, v]) => fd.append(k, String(v)))
  return fd
}

export function LoginForm() {
  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginInput) => {
    const result = await login(initialState, toFormData(data))
    if (!result.success) {
      form.setError('root', { message: result.error })
    }
    // success path — Server Action redirects, no client-side handling needed
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <input {...form.register('email')} type="email" className="rounded-card border px-3 py-2" />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div>
        <input {...form.register('password')} type="password" className="rounded-card border px-3 py-2" />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>
      {form.formState.errors.root && (
        <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
      )}
      <button type="submit" disabled={form.formState.isSubmitting} className="rounded-card bg-brand-500 px-4 py-2 text-white">
        Sign in
      </button>
    </form>
  )
}
```

Use this flow when:

- Field-level real-time validation feedback is part of the UX.
- Async field validation (checking values against the server before submit).
- Dependent fields (changing field A enables/disables/changes field B).
- Multi-step wizards.

**Defense in depth.** The same `LoginSchema` validates client (`zodResolver`) and server (`safeParse` inside the action). Skipping server-side parse turns the schema into client-only theater — anyone can post bypassing the form. Always parse server-side too.

See [../rules/forms.md](../rules/forms.md) for the simple-vs-complex decision matrix.

## Cross-References — Three-Way Data Fetching

This pattern handles MUTATIONS. The other two paths in the three-way split:

- **Reads on the server (default):** [queries-in-rsc.md](./queries-in-rsc.md). Use whenever data can be fetched at render time on the server.
- **Client-reactive data (opt-in):** [hooks-and-query.md](./hooks-and-query.md). Polling, user-driven filters, optimistic updates with rollback, cross-tab sync. Not the default — opt-in when client reactivity is genuinely required.

See [../rules/server-actions.md](../rules/server-actions.md) for the rule-level dictate (every action carries `'use server'`, every action parses its input, errors are values not throws). See [environment-validation.md](./environment-validation.md) for env access inside actions.
