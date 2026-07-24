# Assets and Icons

Icons in a web project are imported as React components from SVG files — never reconstructed by hand. Raster images are rendered via `next/image` for automatic optimization. Truly static assets live under `public/`.

## Icons — Never Reconstruct From Scratch

An icon that exists as a vector shape in a design tool (Figma or similar) must be imported as an SVG file and rendered through the project's SVG-to-component mechanism. Never reconstruct it inline using `<svg>` and `<path>` primitives.

Reconstruction is unreliable (visual drift from the source), wasteful (dozens of lines of coordinate data per icon), and untraceable (no link back to the design system). Pixel-accurate SVG round-trip is a solved problem; the export-and-import path always wins on accuracy and review surface.

```tsx
// WRONG — hand-reconstructed SVG
export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
```

```tsx
// CORRECT — imported SVG component
import { SearchIcon } from '@shared/assets/icons'

<SearchIcon className="h-6 w-6 text-foreground" />
```

When exporting an icon from a design tool, prefer the tool's native SVG export over hand-reconstructing the paths — that export is the canonical rendering. Only fall back to reconstructing from raw path/vector data if no export path is available, and flag that fallback in the PR description so a reviewer verifies the visual match.

## SVG Imports in Next.js

Next.js does not import SVGs as React components by default — the loader has to be configured. Pick one of two mechanisms and use it consistently across the project.

### Transformer Configuration

Either configure `@svgr/webpack` directly in `next.config.ts`, or install `next-plugin-svgr` for a plugin-managed setup. Both end up calling `@svgr/webpack` under the hood; pick one and stick with it.

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })
    return config
  },
}

export default nextConfig
```

After this, `import SearchIcon from './search.svg'` returns a React component instead of a URL.

### Per-Feature vs Shared Colocation

Icons used by a single feature live inside that feature's `assets/icons/` folder. Icons consumed across features live in `@shared/assets/icons/`.

```
features/posts/
  assets/icons/
    bookmark.svg
    share.svg
    index.ts          # barrel re-exporting BookmarkIcon, ShareIcon

shared/assets/icons/
  search.svg
  close.svg
  chevron-down.svg
  index.ts            # barrel re-exporting SearchIcon, CloseIcon, ChevronDownIcon
```

The barrel re-exports each icon as a named React component — kebab-case file becomes PascalCase component plus `Icon` suffix.

```typescript
// shared/assets/icons/index.ts
export { default as SearchIcon } from './search.svg'
export { default as CloseIcon } from './close.svg'
export { default as ChevronDownIcon } from './chevron-down.svg'
```

## Icon Color Convention

Icons accept `className` for sizing and color. Coloring works because the SVG fills and strokes resolve to `currentColor`, so any CSS `color` applied to the icon (or inherited from a parent) sets the icon's color.

When an exported SVG has explicit `fill="..."` or `stroke="..."` attributes hard-coded on its paths, configure SVGR (commonly via the included `svgo` step) to replace them with `currentColor` so consumers can theme the icon via CSS `color`. Otherwise the icon ignores the inherited `color` and stays whatever color the source file set.

```tsx
import { SearchIcon } from '@shared/assets/icons'

<SearchIcon className="h-5 w-5 text-foreground/70" />
<SearchIcon className="h-8 w-8 text-brand-500" />
```

The same component renders at any size, in any theme color, without per-icon work.

## next/image for Raster Assets

Use `next/image` for every raster image (PNG, JPG, WebP, AVIF) in the application. The component delivers automatic format conversion, lazy loading by default, responsive sizing, and CLS prevention with virtually no per-image work.

### Required Props

`next/image` requires either explicit `width` + `height`, or `fill` mode inside a sized parent (a positioned container, typically `position: relative`).

```tsx
import Image from 'next/image'
import heroImg from '@shared/assets/hero.jpg'

// Static dimensions, eager (above the fold)
<Image
  src={heroImg}
  alt="Hero illustration"
  width={1200}
  height={600}
  priority
/>

// Fill mode in a sized parent, lazy
<div className="relative h-64 w-full">
  <Image
    src="/banner.jpg"
    alt="Promotional banner"
    fill
    className="object-cover"
  />
</div>
```

Imported images (`heroImg` in the first example) come with intrinsic `width`/`height` baked in by the Next.js loader, so the props are derived automatically when omitted; URL-string sources require explicit dimensions or `fill`.

### priority Hint

Set `priority` on above-the-fold images (hero, header logo, primary product image). The hint disables lazy loading and prioritizes the image in the browser's resource queue, improving Largest Contentful Paint (LCP). Use sparingly — every image marked `priority` competes with the others.

## public/ for Static Assets

Files served directly by URL — favicon, OG images, `robots.txt`, `manifest.json`, downloadable PDFs — live under `public/`. They are NOT imported; they are referenced via absolute web paths.

```
public/
  favicon.ico             # → /favicon.ico
  og-default.png          # → /og-default.png
  robots.txt              # → /robots.txt
```

```tsx
<Image src="/og-default.png" alt="Open Graph image" width={1200} height={630} />
```

Distinguish `public/` from imported assets:

- `public/<file>` — served directly by URL. Used for files the browser fetches by path (favicons, social-share images, downloadable files).
- `@shared/assets/<file>` — imported by code, bundled, transformed by the loader. Used for images and icons that are part of the rendered UI.

See [directory-structure.md](./directory-structure.md) for where these directories sit in the project layout.

## When the Rule Legitimately Flexes

The "never reconstruct" rule is about static icons. It does not cover every vector use case:

- **Animated or runtime-interactive vectors** (progress rings, paths animated by state, charts whose shape derives from data) may require hand-written SVG primitives — there is no static source file to import.
- **Procedurally-generated charts** are not icons. They belong in a charting library or a custom chart component, not in an icon directory.
- **Decorative shapes** built from a few CSS-only elements (a tinted circle, a chevron made from borders) are usually better as plain CSS than as imported SVGs.
