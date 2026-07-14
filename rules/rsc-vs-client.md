---
paths: ["app/**/*.tsx", "src/**/*.tsx"]
---

# Server Components vs Client Components

## RSC — The Default

Every component is a **React Server Component (RSC) by default**. `app/page.tsx`, `app/layout.tsx`, `app/loading.tsx`, `app/error.tsx`, and every component imported transitively from them, render on the server unless one of the explicit `'use client'` triggers below applies.

What an RSC can do that a client component cannot:

- `await` data directly inside the component body
- Wrap children in `<Suspense>` for streaming
- Call Server Actions and Node-side APIs (`fs`, `crypto`, env-only secrets) at render time
- Ship **zero JavaScript** to the browser for the rendered tree

What an RSC cannot do — see "What RSC Cannot Do" below.

The default position is RSC. The decision to add `'use client'` is one you make at the **component level** — not the file level, not the route level — and only when the component's own behavior demands it.

## When to Add `'use client'`

Add `'use client'` as the first non-comment line of a file, before any imports, when **any** of the following triggers applies inside that file's exported component or its hooks:

### Triggers — Add `'use client'`

1. **React state hooks** — `useState`, `useReducer`, `useRef`, `useContext` (when reading a context)
2. **React effect hooks** — `useEffect`, `useLayoutEffect`, `useInsertionEffect`
3. **DOM event handlers attached to JSX elements** — `onClick`, `onChange`, `onSubmit`, `onKeyDown`, `onMouseEnter`, etc.
4. **Browser-only APIs** — `window`, `document`, `navigator`, `localStorage`, `sessionStorage`, `IntersectionObserver`, `ResizeObserver`, `matchMedia`
5. **Third-party client-only libraries** — anything that touches `window` or `document` at import time, or imports React hooks under the hood (most charting, animation, drag-and-drop, and toast libraries)
6. **Custom hooks transitively using any of the above** — if `useLoginForm` calls `useState`, then any component using `useLoginForm` must be `'use client'` (or extract the stateful piece down)

```tsx
// ✅ CORRECT — directive at top, triggered by useState
'use client'

import { useState } from 'react'

export const Counter: FC = () => {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  )
}
```

### Anti-Triggers — Do NOT Add `'use client'`

These look client-y but run server-side and do **not** require the directive:

- **`await fetch(...)`** — RSC supports top-level await
- **`<form action={serverAction}>`** — the `action` prop receives a server reference; the form submit runs on the server, not in the browser
- **Conditional rendering based on data** — `if (user) return <Dashboard />` is plain server-side branching
- **Composing classNames with `cn()`** — pure rendering, no hooks involved
- **Passing a Server Action as a prop to a client component** — Server Actions serialize to a server reference; this is the supported boundary mechanism

```tsx
// ✅ CORRECT — pure RSC; no directive
import { login } from './actions'

export default function LoginPage() {
  return (
    <form action={login}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Sign in</button>
    </form>
  )
}
```

## Boundary Discipline — Push Client Down

When a page or layout has a small interactive piece, **extract that piece** into its own client component instead of marking the whole tree client. The point of RSC is shipping less JS — marking parents `'use client'` defeats it.

```tsx
// ❌ FORBIDDEN — entire page marked client because of one input
'use client'

import { useState } from 'react'

import { ProductGrid } from './ProductGrid'

export default function CatalogPage({ products }: Props) {
  const [query, setQuery] = useState('')
  const filtered = products.filter(p => p.name.includes(query))

  return (
    <main>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <ProductGrid products={filtered} />
    </main>
  )
}
```

```tsx
// ✅ CORRECT — page stays RSC; only the search input is client
// app/catalog/page.tsx
import { getProducts } from '@features/catalog/queries'

import { CatalogSearch } from './CatalogSearch'

export default async function CatalogPage() {
  const products = await getProducts()

  return (
    <main>
      <CatalogSearch products={products} />
    </main>
  )
}

// app/catalog/CatalogSearch.tsx
'use client'

import { useState } from 'react'

import { ProductGrid } from './ProductGrid'

export const CatalogSearch: FC<Props> = ({ products }) => {
  const [query, setQuery] = useState('')
  const filtered = products.filter(p => p.name.includes(query))

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <ProductGrid products={filtered} />
    </>
  )
}
```

The page stays RSC, the data fetch streams from the server, and only the search box and grid render on the client. Every node above `CatalogSearch` ships zero JS.

`ProductGrid` itself can stay RSC if it doesn't need state — a client component can render RSC children when those children are passed as props (see prop serialization below).

## What RSC Cannot Do

| Concern | RSC | Client component |
|---------|-----|------------------|
| `useState`, `useReducer`, `useRef`, `useContext` | ❌ | ✅ |
| `useEffect`, `useLayoutEffect` | ❌ | ✅ |
| `onClick`, `onChange`, other DOM event handlers | ❌ | ✅ |
| `window`, `document`, browser APIs | ❌ | ✅ |
| `await` at the top of the component body | ✅ | ❌ |
| `<Suspense>` boundaries around children | ✅ | ✅ |
| Importing a Server Action and calling it in `<form action>` | ✅ | ✅ (becomes a server reference) |
| Reading server-only env (`SECRET_KEY`) | ✅ | ❌ |

If you need both — server data **and** interactive state — fetch on the server, pass the data to a client component as a prop, and let the client component own the interaction.

## Prop Serialization Across the Boundary

Props passed from an RSC into a client component must be **JSON-serializable**. The boundary is a wire — class instances, functions, and non-plain objects do not survive it.

| Allowed | Not allowed |
|---------|-------------|
| Primitives (`string`, `number`, `boolean`, `null`, `undefined`) | Functions defined in the RSC |
| Plain objects and arrays of allowed values | Class instances (`Date` is OK; custom classes are not) |
| Server Actions imported at the top of the RSC | DOM nodes, refs |
| `Date` (Next.js serializes it) | Symbols, BigInt (with caveats) |
| `Map`, `Set` (with caveats — prefer plain objects/arrays) | Functions returned from a hook |

```tsx
// ❌ FORBIDDEN — handler defined in RSC and passed to client component
// (handler isn't serializable; the wire dies on this prop)
export default function Page() {
  const handleClick = () => console.log('clicked')
  return <ClientButton onClick={handleClick} />
}

// ✅ CORRECT — Server Action passed as prop; serializes to a server reference
import { recordClick } from './actions'

export default function Page() {
  return <ClientButton onAction={recordClick} />
}
```

If a client component genuinely needs an event handler, define it inside the client component itself — the RSC's job is to provide the data, not the closures.

## Common Mistakes

- **Reflexive `'use client'` on every file** — defeats the whole point of RSC. The default is server.
- **Marking the parent client because the child needs state** — invert. Mark the leaf; let the parent stay server.
- **`<ClientButton onClick={handler} />` from RSC** — handlers defined in RSC don't serialize. Move the handler down or replace it with a Server Action prop.
- **`useState` inside an RSC** — this is a build error, not a subtle bug; the trigger list above tells you to add `'use client'`.
- **`'use client'` placed below the imports** — it must be the first non-comment line of the file. Placement rule lives in [Code Style Rules](./code-style.md).
- **Passing a TanStack Query hook into an RSC** — query hooks are client-only. Either fetch on the server with native `fetch` (see [Data Fetching Rules](./data-fetching.md)), or move the consumer to a client component.

For the data layer that pairs with these boundaries, see [Data Fetching Rules](./data-fetching.md). For the mutation boundary that flows through Server Actions regardless of which side initiates them, see [Server Actions Rules](./server-actions.md).
