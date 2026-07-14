---
paths: ["src/features/**/components/**Form*.tsx", "src/features/**/forms/**"]
---

# Forms Rules

## Zod Schema — Single Source of Truth

Every form has exactly one Zod schema. The schema validates on the client (via React Hook Form's `zodResolver`) **and** on the server (inside the Server Action). The TypeScript type is derived from the schema, never hand-written.

```typescript
// src/features/auth/schema.ts
import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

export type LoginInput = z.infer<typeof LoginSchema>
```

```typescript
// ❌ FORBIDDEN — two sources of truth, drift inevitable
export interface LoginInput {
  email: string
  password: string
}

const validateEmail = (email: string): boolean => /\S+@\S+\.\S+/.test(email)
```

```typescript
// ✅ CORRECT — schema is the source; type derived; one validator runs everywhere
import { LoginSchema, type LoginInput } from './schema'
```

The same `LoginSchema` is consumed by the form component (client validation), by the Server Action (server validation, defense in depth), and as the source of the TypeScript type. Never duplicate — drift between client and server validation is a bug factory.

## Decision Matrix — Simple vs Complex Form

Two paths. Pick one based on the form's interaction needs.

| Trait | Simple form | Complex form |
|-------|-------------|--------------|
| Submission | `<form action={serverAction}>` | RHF `handleSubmit(serverAction)` |
| Pending / error UI | `useActionState` | `form.formState.isSubmitting` + `form.setError('root', ...)` |
| Field-level validation while typing | No (HTML5 + server bounce-back) | Yes (`mode: 'onChange'` or `'onBlur'`) |
| Dependent fields | No | Yes |
| Async field validation (e.g. "is this username taken") | No | Yes |
| Multi-step wizard | No | Yes |
| Controlled inputs (date pickers, custom inputs) | No | Yes |
| RHF dependency | None | `react-hook-form` + `@hookform/resolvers/zod` |

When in doubt, start **simple**. Reaching for React Hook Form on a single-input email-subscribe field is over-engineering. Reaching for it on a 12-field profile form with cross-field validation is necessary.

## Simple Form Pattern

For one-shot submissions where the user types, hits submit, and sees either success (redirect) or a single error message — login, sign-up, simple settings update — the simple pattern wins.

### Skeleton

```tsx
// src/app/(auth)/login/page.tsx
import { LoginForm } from '@features/auth/components/LoginForm'

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-sm py-12">
      <h1 className="mb-6 text-2xl font-semibold">Sign in</h1>
      <LoginForm />
    </main>
  )
}
```

```tsx
// src/features/auth/components/LoginForm/LoginForm.tsx
'use client'

import { useActionState } from 'react'

import { login, type LoginState } from '../../actions'

const initialState: LoginState = { success: false }

export const LoginForm: FC = () => {
  const [state, formAction, isPending] = useActionState(login, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Email</span>
        <input
          name="email"
          type="email"
          required
          className="rounded-md border border-border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="rounded-md border border-border px-3 py-2"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
      >
        {isPending ? 'Signing in...' : 'Sign in'}
      </button>

      {!state.success && state.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}
    </form>
  )
}
```

The form component is thin. The Server Action does the heavy lifting — Zod validation, business logic, redirect on success. The hook surfaces pending and error states. No RHF, no controllers, no resolvers.

### `useActionState` Notes

- The action's first parameter is `prevState` — declared in the action's signature, used to thread state across submissions
- `formAction` is the prop you pass to `<form action>` — not the original action function
- `isPending` is `true` from submission until the action returns (or redirects)
- The state's shape is up to you — typically a discriminated union mirroring the action's return type

## Complex Form Pattern

For forms with field-level real-time validation, dependent fields, controlled inputs, or multi-step wizards — profile editing, checkout, anything with rich client interaction — use React Hook Form with `zodResolver`.

### Skeleton with `zodResolver`

```tsx
// src/features/profile/components/ProfileForm/ProfileForm.tsx
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { updateProfile } from '../../actions'
import { ProfileSchema, type ProfileInput } from '../../schema'

const defaultValues: ProfileInput = {
  displayName: '',
  email: '',
  bio: '',
}

export const ProfileForm: FC = () => {
  const form = useForm<ProfileInput>({
    resolver: zodResolver(ProfileSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const onSubmit = async (data: ProfileInput): Promise<void> => {
    const result = await updateProfile(data)

    if (!result.success) {
      form.setError('root', { message: result.error })
      return
    }

    form.reset(data)
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Display name</span>
        <input
          {...form.register('displayName')}
          className="rounded-md border border-border px-3 py-2"
        />
        {form.formState.errors.displayName && (
          <p className="text-destructive text-sm">
            {form.formState.errors.displayName.message}
          </p>
        )}
      </label>

      {/* additional fields ... */}

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
      >
        {form.formState.isSubmitting ? 'Saving...' : 'Save'}
      </button>

      {form.formState.errors.root && (
        <p className="text-destructive text-sm">
          {form.formState.errors.root.message}
        </p>
      )}
    </form>
  )
}
```

Note that the Server Action here is invoked directly with the validated `data` object — no `FormData` round-trip. The action's signature accepts the typed input and re-validates with the same Zod schema before any business logic.

### Submission Flow

1. User types — RHF runs the resolver per field per `mode` config (instant feedback)
2. User submits — RHF runs the resolver across all fields; if any fail, no action call
3. RHF passes typed `data` to the Server Action
4. Server Action **re-validates** with the same Zod schema (defense in depth — never trust the wire)
5. Server Action executes business logic, returns discriminated result
6. Form receives the result; on failure, surface via `form.setError('root', ...)`; on success, redirect happens server-side or the form resets

The double validation is intentional. Client validation is UX (instant feedback); server validation is correctness (the wire is untyped). Both run the same schema — no drift possible.

## Field-Level Errors

Each field renders its error inline below the input, styled with `text-destructive text-sm`. The form-level error (`errors.root`) renders near the submit button.

```tsx
{form.formState.errors.email && (
  <p className="text-destructive text-sm">
    {form.formState.errors.email.message}
  </p>
)}
```

For accessibility, link the error to the input via `aria-describedby` and `aria-invalid`:

```tsx
<input
  {...form.register('email')}
  aria-invalid={form.formState.errors.email ? 'true' : 'false'}
  aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
/>
{form.formState.errors.email && (
  <p id="email-error" className="text-destructive text-sm">
    {form.formState.errors.email.message}
  </p>
)}
```

## When NOT to Reach for RHF

- **Single-input forms** — search box, email subscribe, newsletter signup. Plain `<form action={action}>` with HTML5 attributes (`required`, `type="email"`, `pattern`) is sufficient.
- **Plain HTML5 validation suffices** — the platform's built-in validation handles required fields, email format, and length without library overhead. Add RHF only when the platform falls short.
- **Wizard with state owned by a client store** — multi-step flows where each step's state lives in a client-side store (cross-step navigation, persist on reload) sometimes work better with raw `<input>` + state writes, with RHF used only inside the steps that have real validation needs.

If you're tempted to reach for RHF, ask: does this form have field-level validation while typing, dependent fields, async validation, or controlled inputs? If no, the simple pattern is the right answer.

## Common Mistakes

- **RHF for a one-input form** — over-engineering. Use the simple pattern.
- **Skipping server-side Zod validation** — the wire is untyped; RHF runs in the browser. Without server validation, a malformed request crashes the action.
- **Duplicating form state in a client store and RHF** — pick one owner per piece of state. RHF owns form state; the store owns app-wide state. They don't overlap.
- **Awaiting `redirect()` from `onSubmit`** — `redirect` throws server-side; the client promise never resolves. Either use `<form action>` (lets the platform handle the redirect) or call the action and let it redirect server-side without awaiting it client-side.
- **Calling the Server Action from a non-form context without revalidation** — every mutation needs `revalidatePath` or `revalidateTag`. See [Server Actions Rules](./server-actions.md).
- **Hand-writing the input type instead of `z.infer<typeof Schema>`** — guarantees drift. Always derive the type.

For typing of form state and action results, see [Typing Rules](./typing.md). For the styling of inputs, error text, and form layout, see [Styling Rules](./styling.md). For the Server Action contract this layer drives, see [Server Actions Rules](./server-actions.md). For the data-layer interactions surrounding form submission (cache invalidation, related queries), see [Data Fetching Rules](./data-fetching.md). For state that lives outside the form lifecycle (auto-save drafts, multi-step wizard state), see [State Management Rules](./state.md).
