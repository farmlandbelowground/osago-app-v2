# Metadata and SEO

Metadata in App Router is set via two mechanisms: a static `export const metadata: Metadata` in `layout.tsx` or `page.tsx` for compile-time-known fields, and an async `generateMetadata` for runtime-derived fields (e.g. dynamic page titles from data). Open Graph and Twitter card fields ship via the same `Metadata` object.

## Static metadata Export

Use the static export when title, description, and other fields are known at build time. The export sits at the top of the file, alongside the default page or layout export.

```typescript
// app/posts/page.tsx
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Posts | My App',
  description: 'Latest posts from My App',
  keywords: ['posts', 'blog', 'my-app'],
}

export default async function PostsPage() {
  // ... renders the page ...
}
```

Static metadata is the default — use it whenever the values do not depend on runtime data. Static is faster to compute, easier to reason about, and trivially diff-able when copy changes.

## Dynamic generateMetadata

When metadata depends on runtime data (route params, search params, or upstream content), export an async `generateMetadata` function alongside the page. The function receives `{ params, searchParams }` and returns a `Metadata` object (or a `Promise<Metadata>`).

```typescript
// app/posts/[slug]/page.tsx
import { type Metadata } from 'next'
import { getPostBySlug } from '@features/posts/queries'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  return {
    title: `${post.title} | My App`,
    description: post.excerpt,
  }
}

export default async function PostPage({ params }: Props) {
  // ... renders the post page ...
}
```

The framework caches `fetch` calls within the same request — calling `getPostBySlug` in both `generateMetadata` and the page renderer hits the network once, not twice.

## Open Graph and Twitter Card Fields

Open Graph fields drive how the page renders when shared on social platforms; Twitter card fields drive the same on Twitter/X specifically. Both go inside the same `Metadata` object.

```typescript
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Posts',
  description: 'Latest posts from My App',
  openGraph: {
    title: 'Posts | My App',
    description: 'Latest posts',
    images: ['/og-posts.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Posts | My App',
    description: 'Latest posts',
    images: ['/og-posts.png'],
  },
}
```

The image referenced (`/og-posts.png`) is served from `public/` — see [directory-structure.md](./directory-structure.md) for `public/` conventions. For dynamic images per page, generate them with Next.js's image-generation helpers and reference them by route in the same way.

## metadataBase in Root Layout

`metadataBase` belongs in the root `app/layout.tsx`. It is the absolute URL Next.js uses to resolve relative URLs in OG and Twitter image fields. Without it, relative paths render incorrectly on social platforms.

```typescript
// app/layout.tsx
import { type Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: { default: 'My App', template: '%s | My App' },
  description: 'My App description',
}
```

The `title` field accepts a `{ default, template }` object: nested pages can set a short title (`title: 'Posts'`) and the template wraps it (`'Posts | My App'`). The default is used when a nested page does not override the title at all.

`metadataBase` is environment-dependent — production points at the canonical domain, preview deployments at the preview URL. Drive the base URL from `env.NEXT_PUBLIC_SITE_URL` (or equivalent) so each environment renders the correct absolute URLs.

## Code Examples

A full root-layout metadata declaration paired with a page-level override:

```typescript
// app/layout.tsx
import { type Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: { default: 'My App', template: '%s | My App' },
  description: 'My App description',
  openGraph: {
    type: 'website',
    siteName: 'My App',
    images: ['/og-default.png'],
  },
  twitter: {
    card: 'summary_large_image',
  },
}
```

```typescript
// app/posts/page.tsx
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Posts',
  description: 'Latest posts from My App',
  openGraph: {
    images: ['/og-posts.png'],
  },
}
```

The page-level metadata composes with the root: `title` becomes `'Posts | My App'` via the root's template; the page's OG image overrides the root's default; everything else (siteName, twitter card, metadataBase) inherits from the root.

See [page-and-layout.md](./page-and-layout.md) for where the metadata declarations live in the broader layout and page anatomy.
