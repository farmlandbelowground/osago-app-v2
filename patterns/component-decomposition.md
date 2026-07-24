# Component Decomposition

> "split components into smaller ones whenever a return JSX mixes multiple distinct responsibilities — each component should have one zone of responsibility"

This is the foundational principle. Everything below describes how to apply it in a Next.js App Router project: when to decompose, when not to, where the extracted piece lives, and the web-specific consideration of how the split intersects with the RSC vs `'use client'` boundary.

## The Core Principle

Components should have one zone of responsibility. When the JSX returned by a component mixes multiple distinct concerns — different visual sections with their own structure, different interactive behaviors, different data sources — extract each concern into its own component.

Components are units of meaning. A `<UserProfileCard>` describes one thing: a user's profile card. If the same component also renders the user's recent activity feed and a panel of admin actions, the name no longer captures what the file does, and any change to one section drags review attention across all of them.

## When to Decompose

### Signals

- **JSX exceeds ~60–80 lines mixing distinct concerns.** Web JSX with CSS classes is denser per line than a typical mobile component, so the threshold sits lower. Past this point, the visual structure is hard to scan in one screen.
- **Repeated structural patterns.** A group of elements (heading + text + action button) appears two or more times with minor variations. Extract the shared shape; pass the variations as props.
- **Deeply nested JSX.** When the return contains more than three or four nested levels, the indentation hides intent. Extract intermediate layers as named components.
- **Conditional rendering blocks.** Large `{condition && (...)}` or ternary blocks that span dozens of lines obscure the layout. Move each branch into its own component and call it conditionally.
- **Multi-state interactivity cluster.** A section with several state hooks plus event handlers plus derived values forms a cohesive boundary worth extracting. The cluster is one zone of responsibility — interactive behavior over a specific UI fragment.
- **Mixed RSC/client concerns.** When a section needs `'use client'` but its parent does not, EXTRACT the client section as its own component so the parent stays a Server Component. This signal has no equivalent on platforms that lack a server-side render boundary; on web it is one of the strongest decomposition triggers.

### Do NOT Extract

Extraction has costs — naming, file overhead, prop wiring, an extra hop when reading the code. Skip extraction when the cost outweighs the benefit:

- **Fewer than ~15 lines, used once.** Inline JSX is more readable; extracting adds an unnecessary file.
- **Extraction would require passing 5+ props just to move JSX.** When most of the props are pass-through state, the parent is the natural owner.
- **Single-expression wrapper.** A component whose entire body is one `<Heading>` or one `<div>` adds zero clarity.

## Local vs Shared

Where the extracted component lives is a function of who consumes it. The decision is simple and has no atomic-design tiers — the only axis is local-vs-shared, and `shared/` is flat.

### Decision Rule

| Scenario | Destination |
|---|---|
| Used by **one page only** | `features/<name>/components/` (feature-local) |
| Used by **2+ pages within the same feature** | `features/<name>/components/` (still feature-local) |
| Used by **2+ different features** | `@shared/components/` (flat — no tiers) |

Default to local. Promote to shared only when a second feature actually needs the component — speculative shared components age badly and accumulate optional props as each new consumer pulls in slightly different requirements.

### Flat shared/components/

`@shared/components/` is **flat**. There are no `atoms/`, `molecules/`, or `organisms/` subfolders. Component name plus folder is the only organization. This avoids the recurring "is this an atom or a molecule?" debate and matches the pattern most projects adopt with shadcn/ui-style component libraries.

## RSC vs Client Component Decomposition

Web has a decomposition axis that other platforms do not: every component is either a React Server Component (RSC, the default) or a `'use client'` component. The split between them is not free, and the way you decompose directly determines which fragments stay on the server and which ship to the browser.

### Push 'use client' Down the Tree

When you split a component, classify each fragment:

- **Stays RSC** — no hooks, no event handlers, no browser APIs, no third-party client-only libraries. Can fetch data via `await`. Ships zero JavaScript to the browser.
- **Must become `'use client'`** — uses `useState`, `useReducer`, `useRef`, `useContext`, `useEffect`, `useLayoutEffect`, event handlers (`onClick`, `onChange`), browser APIs (`window`, `document`, `localStorage`), or third-party client-only libraries.

**Push `'use client'` boundaries as far down the tree as possible.** A page should stay RSC; only the leaf component(s) that genuinely need interactivity should be marked client.

### Anti-Pattern

Marking the entire `page.tsx` as `'use client'` because one nested button needs an `onClick`. The whole subtree now ships to the browser, the page can no longer fetch data via `await`, and every nested RSC has to be replaced with a client equivalent.

```tsx
// WRONG — entire page becomes client because of one button
'use client'

import { useState } from 'react'

export default function PostPage({ post }) {
  const [liked, setLiked] = useState(false)
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
      <button onClick={() => setLiked(!liked)}>Like</button>
    </article>
  )
}
```

### Correct

Page stays RSC, fetches data, passes serializable props to a small client island that owns only the interactive bit.

```tsx
// app/posts/[id]/page.tsx — RSC (no 'use client')
import { getPostById } from '@features/posts/queries'
import { LikeButton } from '@features/posts/components/LikeButton'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PostPage({ params }: Props) {
  const { id } = await params
  const post = await getPostById(id)
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
      <LikeButton postId={post.id} initialLiked={post.viewerLiked} />
    </article>
  )
}
```

```tsx
// features/posts/components/LikeButton/LikeButton.tsx — client island
'use client'

import { useState } from 'react'

interface Props {
  postId: string
  initialLiked: boolean
}

export function LikeButton({ postId, initialLiked }: Props) {
  const [liked, setLiked] = useState(initialLiked)
  return <button onClick={() => setLiked(!liked)}>Like</button>
}
```

The page stays on the server. The like button is the only thing that ships to the browser. See [../rules/rsc-vs-client.md](../rules/rsc-vs-client.md) for the full client-trigger list and the forbidden patterns.

### Server-Renderable Fragments Stay RSC

When decomposing, prefer extracting RSC fragments wherever possible. A `<UserAvatar user={user}>` that renders a static image and name is a perfect RSC — it ships no JavaScript, and the parent page can compose it freely. Only escalate to `'use client'` when a leaf genuinely needs interactivity. See [page-and-layout.md](./page-and-layout.md) for the canonical RSC-page-with-client-island composition.

## Local Sub-Component Structure

A component extracted as feature-local lives inside `features/<name>/components/<ComponentName>/`. Each component folder follows a consistent shape:

```
features/auth/components/LoginForm/
  LoginForm.tsx           # the component
  types.ts                # Props interface and any sub-types
  index.ts                # public re-export
```

The parent imports via the folder, not the file:

```typescript
import { LoginForm } from '@features/auth/components/LoginForm'
```

`'use client'` lives at the top of the `.tsx` file when the component needs it. The `types.ts` and `index.ts` siblings do NOT carry `'use client'` — they are type-only and re-export-only respectively, and the directive would force the bundler to include them in the client graph for no reason.

## Examples

A `ProfilePage` composed of three layered concerns:

1. RSC outer page that fetches the user.
2. RSC fragment that displays static profile fields (name, email, joined date).
3. Client island for the editable bio.

```tsx
// app/profile/page.tsx — outer page (RSC)
import { getCurrentUser } from '@features/profile/queries'
import { ProfileHeader } from '@features/profile/components/ProfileHeader'
import { EditableBio } from '@features/profile/components/EditableBio'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <ProfileHeader user={user} />
      <EditableBio userId={user.id} initialBio={user.bio} />
    </main>
  )
}
```

```tsx
// features/profile/components/ProfileHeader/ProfileHeader.tsx — RSC fragment
import { type User } from '@features/profile/types'

interface Props {
  user: User
}

export function ProfileHeader({ user }: Props) {
  return (
    <header>
      <h1 className="text-2xl font-semibold">{user.name}</h1>
      <p className="text-foreground/70">{user.email}</p>
    </header>
  )
}
```

```tsx
// features/profile/components/EditableBio/EditableBio.tsx — client island
'use client'

import { useState } from 'react'

interface Props { userId: string; initialBio: string }

export function EditableBio({ userId, initialBio }: Props) {
  const [bio, setBio] = useState(initialBio)
  // ... edit handlers, save call ...
  return <textarea value={bio} onChange={e => setBio(e.target.value)} />
}
```

Three components, three zones of responsibility. The page composes them. The header ships zero JavaScript. The editable bio ships only what it needs.
