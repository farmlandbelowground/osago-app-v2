---
paths: ["src/features/**/store/**", "src/shared/store/**"]
---

# State Management Rules (Zustand)

## Per-Feature Stores — Default

Each feature owns its store, colocated under `src/features/<name>/store/`. Cross-feature shared stores are rare and live under `src/shared/store/<concern>/` — promote a store there only when at least two features genuinely need the same instance.

```
src/features/auth/store/
  auth.store.ts    # store creator
  types.ts         # state and actions types
  index.ts         # re-export: export { useAuthStore } from './auth.store'
```

Stores are not global singletons by convention — they are scoped artifacts a feature happens to expose. The `index.ts` barrel is the public surface; outside consumers import the hook from there:

```typescript
// External consumer (different feature)
import { useAuthStore } from '@features/auth/store'

// Internal (same feature)
import { useAuthStore } from '../store'
```

## Raw Zustand — No Wrapper

Use Zustand's `create` directly. Avoid a project wrapper around it — no `createStore` helper, no auto-persist, no global registry. Wrappers add indirection that is rarely worth the complexity.

```typescript
// ✅ CORRECT — raw zustand
import { create } from 'zustand'

import { type AuthStore } from './types'

export const useAuthStore = create<AuthStore>(set => ({
  isAuthenticated: false,
  user: null,
  setUser: user => set({ user, isAuthenticated: user !== null }),
  signOut: () => set({ user: null, isAuthenticated: false }),
}))
```

```typescript
// ❌ FORBIDDEN — importing a speculative custom wrapper
import { createStore } from '@shared/store'

export const useAuthStore = createStore<AuthStore>(/* ... */)
```

The action functions inside the creator are stable across renders — they do **not** need to be wrapped in `useCallback` when consumed. See [Code Style Rules](./code-style.md) for the memoization guidance.

## Persistence (Opt-In)

Persistence is **opt-in**. Default to non-persisted state; reach for `persist` middleware only when the data must survive a page reload or a fresh tab.

### When to Persist

- Cross-session preferences — theme, locale, last-selected workspace
- Auth tokens or session metadata that the app uses to bootstrap before a server check
- In-progress draft work users would lose on accidental reload (auto-save autocomplete)

```typescript
// ✅ CORRECT — persisted preferences
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { type ThemeStore } from './types'

export const useThemeStore = create<ThemeStore>()(
  persist(
    set => ({
      theme: 'system',
      setTheme: theme => set({ theme }),
    }),
    {
      name: 'theme',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
```

### When NOT to Persist

- Ephemeral UI state — modal open/close, transient flags, tooltip visibility, sidebar collapsed/expanded
- Server data — that belongs in TanStack Query or RSC fetch results, not Zustand (see Server State vs Client State below)
- Anything sensitive in `localStorage` — `localStorage` is not encrypted; tokens that need protection require a server-side session

```typescript
// ❌ FORBIDDEN — persisting ephemeral modal state
export const useModalStore = create<ModalStore>()(
  persist(
    set => ({
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    { name: 'modal', storage: createJSONStorage(() => localStorage) },
  ),
)

// ✅ CORRECT — modal state stays in memory
export const useModalStore = create<ModalStore>(set => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
```

## Selectors — Slice Discipline

Always select the **minimal** slice you need. Selecting the whole store object causes the component to re-render on every state change, even when the change is unrelated.

```typescript
// ❌ FORBIDDEN — re-renders on every store update
const store = useAuthStore()
const user = store.user

// ❌ FORBIDDEN — destructuring the entire store
const { user, isAuthenticated } = useAuthStore()

// ✅ CORRECT — single-field selector
const user = useAuthStore(state => state.user)
const isAuthenticated = useAuthStore(state => state.isAuthenticated)
```

When a component truly needs multiple fields, call the hook once per field. Two hook calls is cheaper than one re-render storm.

For derived values, compute them outside the selector — Zustand compares selector results with `Object.is`, so returning a new object literal every call breaks memoization:

```typescript
// ❌ FORBIDDEN — new object every render, breaks shallow equality
const { user, isAuthenticated } = useAuthStore(state => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
}))

// ✅ CORRECT — primitive selectors
const user = useAuthStore(state => state.user)
const isAuthenticated = useAuthStore(state => state.isAuthenticated)
```

If you need an object slice for ergonomic reasons, use `useShallow` from `zustand/react/shallow`:

```typescript
import { useShallow } from 'zustand/react/shallow'

// ✅ CORRECT — shallow comparison opts in to multi-field selection
const { user, isAuthenticated } = useAuthStore(
  useShallow(state => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
  })),
)
```

## Naming Conventions

| What | Convention | Example |
|------|------------|---------|
| Store hook | `use<Feature>Store` | `useAuthStore`, `useThemeStore`, `useCartStore` |
| Setter for a single field | `set<Field>` | `setUser`, `setTheme`, `setCart` |
| Toggle for a boolean | `toggle<Field>` | `toggleSidebar`, `toggleTheme` |
| Async action | verb (`signIn`, `loadCart`) | not prefixed |
| Reset action | `reset` | full-store reset |

## Cross-Feature Shared Stores

If two or more features genuinely need the same instance — e.g. an app-wide modal stack, a global toast queue — promote the store to `src/shared/store/<concern>/`:

```
src/shared/store/toast/
  toast.store.ts
  types.ts
  index.ts
```

```typescript
// External consumer
import { useToastStore } from '@shared/store/toast'
```

Treat `src/shared/store/` as scarce. Most state is feature-local; reach for `shared/` only when colocating to one feature would force the other feature to import that feature's internals.

## Server State vs Client State

Zustand is for **client state only** — UI flags, user preferences, in-memory drafts, things that have no server canonical version. Server data does **not** belong in Zustand.

| Kind of state | Where it lives |
|---------------|----------------|
| Read-only data fetched at render time | RSC native `fetch` in `queries.ts` |
| Client-reactive server data (polling, optimistic, user-driven filters) | TanStack Query in `'use client'` components |
| Mutations | Server Actions in `actions.ts` |
| User preferences (theme, locale) | Zustand `persist` |
| Ephemeral UI flags (modal open, sidebar collapsed) | Zustand non-persisted |
| In-progress form drafts (auto-save) | Zustand `persist` (or React Hook Form's internal state for non-persisted) |

```typescript
// ❌ FORBIDDEN — server data in Zustand
interface UserStore {
  user: User | null
  fetchUser: () => Promise<void>
}

export const useUserStore = create<UserStore>(set => ({
  user: null,
  fetchUser: async () => {
    const response = await fetch('/api/me')
    set({ user: await response.json() })
  },
}))

// ✅ CORRECT — server data flows through RSC fetch or TanStack Query
// In an RSC: const user = await getCurrentUser()
// In a client component: const { data: user } = useCurrentUserQuery()
```

See [Data Fetching Rules](./data-fetching.md) for the complete three-way decision matrix between RSC fetch, Server Actions, and TanStack Query. Use Zustand only for state that is genuinely client-owned — server reflections almost always belong in one of the three data-layer paths instead.

For the type definitions backing each store, follow [Typing Rules](./typing.md) — `interface` for the store-state shape, declared in a sibling `types.ts`.
