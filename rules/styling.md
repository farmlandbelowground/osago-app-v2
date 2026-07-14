---
paths: ["app/**/*.tsx", "src/**/*.tsx", "app/**/*.css", "src/**/*.css"]
---

# Styling Rules (Tailwind CSS)

## Tailwind — Sole Styling Mechanism

Use Tailwind CSS as the sole styling mechanism. Avoid a second styling system running alongside it (no styled-components, no Emotion, no CSS Modules outside narrow `@apply` escape hatches). Every visual concern — color, spacing, typography, layout, radius, shadow — is expressed through Tailwind utility classes.

```tsx
// ❌ FORBIDDEN — third-party CSS-in-JS
import styled from 'styled-components'

const Wrapper = styled.div`
  background: #3b82f6;
  padding: 16px;
`

// ❌ FORBIDDEN — inline style for static visual concerns
<button style={{ backgroundColor: '#3b82f6', padding: '8px 16px', borderRadius: '6px' }}>
  Sign in
</button>

// ✅ CORRECT — Tailwind utility classes
<button className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90">
  Sign in
</button>
```

The single legitimate use of inline `style={}` is for genuinely **dynamic** values that cannot be expressed as a fixed utility class — see "Inline `style={}` — Forbidden Except Dynamic" below.

## The `cn()` Helper

Class composition uses a small project helper named `cn()` — a thin combination of `clsx` (conditional classes) and `tailwind-merge` (conflict resolution). Import from `@shared/utils/cn`.

### Definition

```typescript
// src/shared/utils/cn.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs))
```

### Conditional Classes

`cn()` accepts strings, arrays, objects, and falsy values — combine them naturally:

```tsx
import { cn } from '@shared/utils/cn'

interface Props {
  variant: 'primary' | 'secondary'
  isActive?: boolean
  isDisabled?: boolean
}

export const Tab: FC<Props> = ({ isActive, isDisabled, variant, children }) => {
  return (
    <button
      className={cn(
        'rounded-md px-4 py-2 transition-colors',
        variant === 'primary' && 'bg-primary text-white',
        variant === 'secondary' && 'bg-muted text-foreground',
        isActive && 'ring-2 ring-primary',
        isDisabled && 'pointer-events-none opacity-50',
      )}
    >
      {children}
    </button>
  )
}
```

### Class Conflict Resolution

When two utility classes target the same property, `tailwind-merge` keeps the **last** one — so consumer components can override defaults without `!important`:

```tsx
// In a base Button component:
<button className={cn('rounded-md bg-primary px-4 py-2', className)}>

// In a consumer:
<Button className="bg-destructive" />  // bg-destructive wins; bg-primary discarded
```

Without `cn()`, both classes would land in the rendered `class` attribute and the browser would pick one based on stylesheet order — fragile and confusing. Always compose through `cn()` for any component that accepts a `className` prop.

## Class Ordering (Lint-Enforced)

If your linter has a Tailwind class-ordering plugin (e.g. `eslint-plugin-better-tailwindcss`), let it auto-apply a deterministic class order on save and on commit. Write classes in any order while editing — let the formatter normalize.

The canonical order is roughly: **layout → box model → typography → visual → state variants → responsive variants**. Don't memorize the rules; trust the linter.

```tsx
// You write this:
<div className="text-white p-4 flex bg-primary md:p-8 hover:bg-primary/90 rounded-md">

// Linter normalizes to this:
<div className="flex rounded-md bg-primary p-4 text-white hover:bg-primary/90 md:p-8">
```

## Theme Tokens — No Hardcoded Hex

Colors, fonts, spacing, and radii are defined in the theme configuration (the `@theme` block of `globals.css` for Tailwind v4, or `tailwind.config.ts` `theme.extend` for v3), backed by CSS custom properties so theme switching at runtime works without re-renders. Use the **token names** in class strings — never raw hex values. See [`patterns/styling-tailwind.md`](../patterns/styling-tailwind.md) for the canonical layout.

```tsx
// ❌ FORBIDDEN — arbitrary color escape
<div className="bg-[#3b82f6] text-[#ffffff]">

// ❌ FORBIDDEN — hardcoded hex via inline style
<div style={{ backgroundColor: '#3b82f6' }}>

// ✅ CORRECT — semantic tokens
<div className="bg-primary text-primary-foreground">
```

A minimal starting semantic token vocabulary — extend it per your own design system:

| Token | Purpose |
|-------|---------|
| `primary` / `primary-foreground` | Primary brand color and text on it |
| `secondary` / `secondary-foreground` | Secondary action color |
| `accent` / `accent-foreground` | Accent / highlight color |
| `destructive` / `destructive-foreground` | Errors, delete actions |
| `muted` / `muted-foreground` | Muted backgrounds and text |
| `background` / `foreground` | Page background and base text |
| `border` | Default border color |
| `ring` | Focus ring color |

Adding a new token is a theme-configuration change, not a class-string escape. If you find yourself reaching for an arbitrary value, add a token first.

### When Hex Is Truly Necessary

Third-party libraries that accept a JS color value (e.g. a charting library's series colors) need raw values at the call site. Read the token from CSS via `getComputedStyle` or expose it through a typed helper — never duplicate the hex in two places.

## Inline `style={}` — Forbidden Except Dynamic

Inline `style={}` is forbidden for any value Tailwind can express. The narrow exception is **genuinely dynamic** values computed at render time that cannot be enumerated as utility classes.

```tsx
// ❌ FORBIDDEN — static spacing
<div style={{ padding: '8px' }}>

// ❌ FORBIDDEN — static color
<div style={{ backgroundColor: '#3b82f6' }}>

// ✅ CORRECT — dynamic transform driven by a number prop
<div style={{ transform: `translateX(${offsetPx}px)` }}>

// ✅ CORRECT — animation interpolation that cannot be a static class
<div style={{ opacity: progress }}>
```

If you find yourself writing inline style for a value that takes one of three or four discrete values (`'red'`, `'green'`, `'blue'`), it's a class lookup — not a dynamic value. Map the prop to the corresponding utility class instead.

## Responsive Variants

Tailwind is mobile-first. Plain utility classes apply at all breakpoints; prefixed utilities (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) apply at that breakpoint and above.

```tsx
// ✅ CORRECT — base size on mobile, larger on desktop
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Welcome
</h1>

// ✅ CORRECT — stack on mobile, row on tablet+
<div className="flex flex-col gap-4 md:flex-row md:gap-8">
```

Default breakpoints (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`) cover most cases — extend the theme configuration only when the design system requires custom breakpoints.

## Dark Mode

Tailwind's `dark:` variant applies when a `.dark` class (or a `data-theme` attribute) is set on a parent element. The project's theme switch flips that class/attribute on `<html>`; semantic tokens defined in CSS variables flip with it automatically — no per-component conditional logic needed.

```tsx
// ✅ CORRECT — semantic tokens adapt automatically
<div className="bg-background text-foreground">
  Adaptive content
</div>

// ✅ CORRECT — explicit `dark:` overrides for non-tokenized styling
<img
  src="/logo.svg"
  className="invert dark:invert-0"
  alt="Logo"
/>
```

Pure dark/light branching driven by JavaScript is rarely necessary — design the token system so the swap happens at the CSS-variable layer.

## When NOT to Reach for Tailwind

For deep CSS that Tailwind cannot express cleanly — keyframe animations beyond `transition-*`, complex pseudo-states, third-party stylesheet integration — use a co-located `.module.css` file with `@apply` for token-aware values. Keep these narrow.

```css
/* src/features/onboarding/components/StepIndicator/StepIndicator.module.css */
.shimmer {
  @apply absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent;
  animation: shimmer 1.6s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
```

```tsx
import styles from './StepIndicator.module.css'

<div className={cn('relative overflow-hidden rounded-md bg-muted', styles.shimmer)} />
```

The CSS module remains tokenized via `@apply` — no raw colors leak. Reach for this only when Tailwind's utility set genuinely cannot express the effect; do not use CSS modules to recreate Tailwind functionality you didn't bother to learn.

For the imports backing these patterns (the `cn` import path, the relative-vs-alias decision), see [Import Rules](./imports.md). For the formatting and lint conventions that govern class-string layout in JSX, see [Code Style Rules](./code-style.md).
