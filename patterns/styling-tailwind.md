# Styling with Tailwind CSS

Tailwind CSS 4 is the sole styling mechanism. Composition uses the `cn()` helper (`clsx` + `tailwind-merge`). Theme tokens are declared CSS-first via the `@theme` block in `globals.css` — no `tailwind.config.ts` JS config file is required for theme tokens. Tailwind 4 reads CSS custom properties directly from `@theme` to generate utility classes. Dark mode is wired through the `dark:` variant; responsiveness uses mobile-first breakpoint prefixes.

> **Legacy Tailwind v3 teams** can adapt this file by reverse-mapping the `@theme` declarations below to `theme.extend` in `tailwind.config.ts`; everything else (the `cn()` helper, responsive variants, dark mode, class-proliferation strategy, component-library integration) applies unchanged.

## CSS-First Configuration via @theme

Tailwind 4 reads custom properties from a `@theme` block in `globals.css` and generates corresponding utility classes at build time.

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  --color-brand-50: hsl(217 91% 97%);
  --color-brand-500: hsl(217 91% 60%);
  --color-background: hsl(0 0% 100%);
  --color-foreground: hsl(0 0% 0%);
  --font-sans: 'Inter', system-ui, sans-serif;
  --radius-card: 0.75rem;
}
```

The declarations above generate `bg-brand-50`, `bg-brand-500`, `bg-background`, `text-foreground`, `font-sans`, and `rounded-card` automatically. No additional config file is needed for theme tokens.

Source detection in v4 is automatic for content under the project root. Use `@source "..."` directives inside `globals.css` only when you need to extend scanning into non-default locations (files outside the project tree, for example). The default scan handles standard `app/`, `src/`, and `components/` trees without configuration.

## The cn() Helper

`cn()` combines conditional class composition with conflict-aware merging. Internally it is `twMerge(clsx(...inputs))`.

```typescript
// shared/utils/cn.ts
import clsx, { type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Then in components:

```tsx
import { cn } from '@shared/utils/cn'
```

### Conditional Classes

```tsx
<button
  className={cn(
    'rounded-card px-4 py-2',
    isActive && 'bg-brand-500 text-white',
    isDisabled && 'pointer-events-none opacity-50',
  )}
>
  Save
</button>
```

`clsx` ignores falsy entries, so the conditional short-circuits compose cleanly. Each branch contributes its own classes; the merge step resolves any conflicts.

### Conflict Resolution

`tailwind-merge` ensures the LAST conflicting class wins.

```tsx
cn('bg-red-500', condition && 'bg-green-500')
// condition true  → 'bg-green-500'
// condition false → 'bg-red-500'
```

Without `tailwind-merge`, both classes would land in the DOM and CSS specificity (or source order) would decide unpredictably. The merge step is what makes the consumer-side `className` override pattern (`<Component className={cn('default', className)}>`) reliable.

## Responsive Variants

Tailwind uses **mobile-first** breakpoint prefixes. Prefix-less classes apply at all breakpoints; prefixed classes apply at that breakpoint AND ABOVE.

| Prefix | Min width |
|---|---|
| (none) | all sizes |
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |
| `2xl:` | 1536px |

```tsx
<div className="text-sm md:text-base lg:text-lg">
  Body text — small on phones, regular on tablets, large on desktops.
</div>
```

Every layout decision starts from the smallest viewport and adds variants for larger ones. Avoid `max-*` variants unless a desktop-first override is genuinely necessary.

## Dark Mode

Tailwind 4's `dark:` variant applies when `<html class="dark">` is set or a `data-theme="dark"` attribute is present on a parent. Configure the variant declaratively in `globals.css` via `@variant`:

```css
/* src/app/globals.css */
@custom-variant dark (&:where(.dark, .dark *));
```

This is the v4 CSS-first equivalent of v3's `darkMode` config option. The selector matches both the element with the `dark` class and any descendant — so toggling `<html class="dark">` flips every `dark:`-prefixed utility under it.

A small `'use client'` component reads the user's preference (and optionally the system setting) and sets the class on `<html>`.

```tsx
<div className="bg-background text-foreground">
  Semantic tokens flip automatically when dark class is set.
</div>
```

### Token Override Per Theme

Override tokens for dark mode by re-declaring the same custom properties under `.dark` in the same `globals.css`:

```css
.dark {
  --color-background: hsl(0 0% 0%);
  --color-foreground: hsl(0 0% 100%);
}
```

Now `bg-background`, `text-foreground`, and any other token-derived utilities resolve via CSS variables. Runtime theme switching just flips `--*` values — no class recomputation, no FOUC.

```tsx
// WRONG — hardcoded hex defeats theming
<button className="bg-[#3B82F6] text-[#FFFFFF]">Save</button>

// CORRECT — semantic tokens always
<button className="bg-brand-500 text-foreground">Save</button>
```

## Theme Tokens via CSS Custom Properties

Every color, font, and radius referenced in component className strings should resolve to a CSS custom property declared in `@theme`. The reasons compound:

- **One source of truth.** A token change in `@theme` updates every consumer.
- **Theming for free.** Dark mode override is a single re-declaration under `.dark`.
- **Design-system alignment.** Tokens map cleanly to Figma variables, design tokens, or any other design-source spec.

The `bg-[#hex]`, `text-[#hex]`, `text-[14px]` arbitrary-value escape exists for one-off cases. Use it for prototypes; replace with semantic tokens before merging.

## Class Proliferation Strategy

When a single element accumulates more than ~10 utility classes mixed across multiple concerns (sizing + spacing + color + typography + state + interaction), the className becomes hard to read and impossible to grep. Two strategies for collapsing:

### When to Extract a Component

Give the cluster a name. `<PrimaryButton>` is more readable than 12 utility classes.

```tsx
// Before — proliferating classes inline
<button className="rounded-card bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-500/90 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50">
  Save
</button>

// After — named component
<PrimaryButton>Save</PrimaryButton>
```

The component owns the visual contract; the call site captures intent. See [component-decomposition.md](./component-decomposition.md) for the broader extraction signal.

### @apply Escape Hatch

When the cluster recurs but isn't yet a full component, use `@apply` in a component-scoped CSS file:

```css
/* PrimaryButton.module.css or globals.css */
.btn-primary {
  @apply rounded-card bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors;
}
.btn-primary:hover { @apply bg-brand-500/90; }
.btn-primary:disabled { @apply pointer-events-none opacity-50; }
```

Use sparingly. Extracting a component is usually preferred — `@apply` hides the contract behind a class name and makes prop-driven variation harder.

## Component Library Integration

Tailwind does NOT prescribe a UI component library. Common headless libraries integrate cleanly with Tailwind via the `cn()` className-merge pattern. Pick whichever fits the project; the styling contract stays the same.

| Library | Trade-off |
|---|---|
| **shadcn/ui** | Copy-paste components, full source ownership, opinionated defaults. Zero runtime dep. |
| **Headless UI** | Accessible primitives, no styling assumed, fully Tailwind-driven. |
| **Radix UI** | Accessible primitives, more granular than Headless UI, Tailwind-friendly. |

Whichever library is chosen, the className override pattern keeps styling consistent:

```tsx
import { cn } from '@shared/utils/cn'

// Library component accepts className; consumer composes via cn()
<DialogContent className={cn('rounded-card bg-background p-6', className)}>
  ...
</DialogContent>
```

See [../rules/styling.md](../rules/styling.md) for the rule-level dictate (no inline `style={{}}` except for genuinely dynamic values, no hardcoded hex outside `@theme`, lint-enforced class ordering).
