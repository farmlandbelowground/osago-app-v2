---
name: implement-code
description: Implementation mechanics for writing or changing code in this Next.js / TypeScript codebase — greenfield creation, refactoring, and Figma-derived pages alike. Encodes the non-negotiable stack conventions (RSC vs client, Server Actions, Tailwind via cn(), state, typing, imports) so every change is consistent with the rest of the codebase.
---

# Implement Code Skill

Mechanics for turning an agreed-upon change (a feature request, a bug fix, a Figma design, a refactor) into code that fits this codebase's conventions. Use this whenever you're about to write or modify `.ts` / `.tsx` files in this project.

Handles all kinds of work the same way, because the conventions below apply regardless of *why* the code is being written:

- **Greenfield creation** — new utility, hook, Server Action, RSC query, Zustand store, env config entry, shared / feature component, page, layout, route handler
- **Refactoring** — restructuring existing code, decomposing large components, aligning violations with rules, fixing bugs
- **Figma-derived pages** — implementing a route/page from a design (see [Analyze Figma](../analyze-figma/SKILL.md) if you need to extract the design first)

## Before You Start

- Make sure the scope is clear (what files, what behavior) before writing code. For anything beyond a trivial change, a short plan in your own words — files touched, reuse vs. new code, the rough approach — costs little and catches misunderstandings early. There's no formal "spec" or "gate" here; just make sure you and the user agree on scope before you start typing.
- **Reuse before you build.** If you're about to write a new helper, formatter, hook, or wrapper around a platform API, run [Find Package](../find-package/SKILL.md) first — check for an existing local implementation or a solid ecosystem/npm option before writing one from scratch.
- Read the files you're about to touch, in full, before editing them.

## The Thirteen Non-Negotiable Behaviors

Every file you write or modify in this stack must satisfy each of these. The referenced rule/pattern is the source of truth; this list is a recognition aid.

1. **`'use client'` boundary decision per component.** Server Component by default; add `'use client'` only when required (hooks, event handlers, browser APIs), and push the boundary as far down the tree as possible. Refs: [rsc-vs-client](../../../rules/rsc-vs-client.md), [page-and-layout](../../../patterns/page-and-layout.md), [component-decomposition](../../../patterns/component-decomposition.md).
2. **Tailwind via `cn()` — sole styling mechanism.** `cn()` (`clsx` + `tailwind-merge`) for all utility class composition. Inline `style={{}}` only for genuinely dynamic CSS custom property values. Never `useStyles` or `StyleSheet.create` — those are React Native, not this stack. Refs: [styling](../../../rules/styling.md), [styling-tailwind](../../../patterns/styling-tailwind.md).
3. **Server Actions for mutations.** All mutations go through `'use server'` functions in `features/<name>/actions.ts` — Zod input validation, discriminated-union returns, `revalidatePath()` / `revalidateTag()` after mutations, `redirect()` on success. Refs: [server-actions rule](../../../rules/server-actions.md), [server-actions pattern](../../../patterns/server-actions.md).
4. **Native `fetch` + Zod for the API boundary.** No Axios, anywhere. Refs: [api](../../../rules/api.md), [queries-in-rsc](../../../patterns/queries-in-rsc.md).
5. **Per-feature raw Zustand for state.** No wrapper library; `persist` middleware is opt-in only. Ref: [state](../../../rules/state.md).
6. **Env values through `src/env.ts`.** Never raw `process.env.X` at call sites. Refs: [api](../../../rules/api.md), [environment-validation](../../../patterns/environment-validation.md).
7. **App Router file conventions.** `page.tsx` (async Server Component by default), `layout.tsx`, `loading.tsx`, `error.tsx` (`'use client'` boundary with `reset` prop), `route.ts`. Never a `pages/` directory. Refs: [directory-structure](../../../patterns/directory-structure.md), [page-and-layout](../../../patterns/page-and-layout.md).
8. **Focused, domain-named hooks.** `useLoginForm`, `useAuth`, `useProductFilters` — never one monolithic logic hook. Ref: [page-and-layout](../../../patterns/page-and-layout.md).
9. **Path aliases — `@/*`, `@features/*`, `@shared/*`.** No relative `../../` imports when an alias covers the path. Ref: [imports](../../../rules/imports.md).
10. **npm only.** Every command in comments, docs, or instructions uses `npm run <script>` / `npx <bin>`. Ref: [commands](../../../patterns/commands.md) (swap in whatever this project's `package.json` actually defines).
11. **Flat `shared/components/`.** No atomic-tier subdirectories (`atoms/`, `molecules/`, `organisms/`). Feature-specific components live in the feature's own `components/`. Refs: [directory-structure](../../../patterns/directory-structure.md), [component-decomposition](../../../patterns/component-decomposition.md).
12. **Component decomposition — one zone of responsibility per component.** Split at zone boundaries, not arbitrary line-count thresholds. Ref: [component-decomposition](../../../patterns/component-decomposition.md).
13. **Strict TypeScript.** `strict` + `noUnusedLocals` + `noUnusedParameters` + `noFallthroughCasesInSwitch` clean on every file. Ref: [typing](../../../rules/typing.md).

## Typical Implementation Order

When a change spans multiple files, this ordering avoids referencing things that don't exist yet:

1. Tailwind theme additions (if any) — `globals.css` `@theme` block, before consumers reference the tokens
2. Types (`types.ts` files, including per-hook `types.ts`)
3. Server Actions (`actions.ts`)
4. Server-side data-fetching (`queries.ts`)
5. Client-side queries / mutations / focused hooks
6. Server Components first, then `'use client'` components as needed
7. Page-level files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`)
8. Barrel updates (`index.ts` at the relevant module level)
9. Route handlers (`route.ts`) / middleware, if applicable

## Icons (Figma-derived work)

For each icon a Figma design calls for, per [Assets and Icons Pattern](../../../patterns/assets-and-icons.md):

- Preferred: export via the Figma MCP tool (`export_node` / `get_image` with `format: svg`) using the icon's Figma node id
- Fallback: reconstruct from the node's `vectorPaths` / `fillGeometry` — flag this in your summary and recommend a visual check
- Save to `@shared/assets/icons/<filename>.svg` (cross-feature) or the feature's own `assets/icons/<filename>.svg`, update the relevant icons barrel, then import and use it
- Never hand-write SVG paths from scratch without one of the two mechanisms above

## Verification

Before considering the work done:

1. `npm run lint` — zero errors
2. `npx tsc --noEmit` — zero errors
3. Confirm the behavior actually matches what was asked (run the app if it's a UI change — see the project's `run` skill/workflow)
4. **Self-review against the always-load conventions** — lint and type-check don't catch these:
   - **Comment scrub** ([Code Comments](../../../rules/code-comments.md)) — default every comment to *delete*; keep one only if it records a load-bearing *why* the code cannot carry, in 1-2 sentences. Delete anything that restates the code or narrates your reasoning (that belongs in your summary to the user, not the file).
   - **Hook decomposition** — no client hook bundling several independent concerns.
   - **Types home** ([custom-hook-typing](../../../patterns/custom-hook-typing.md) + [typing](../../../rules/typing.md)) — every named type a hook needs lives in its sibling `types.ts`, never declared inline.

   Re-run lint + type-check if this step changed anything.
5. Fix any regressions introduced by the change

## Gap Handling

Small gaps between what was asked and what you encounter while implementing are normal:

- **Tiny gap** (resolvable from this codebase's own documented patterns) — fill with the most consistent value and mention the decision in your summary. Examples: a missing responsive breakpoint when siblings use `md:` — match it; an unspecified `fetch` cache strategy when context clearly implies ISR/static/dynamic — apply the contextually-correct one; a spacing value that should round to the nearest Tailwind scale step.
- **Substantial gap** (needs a new design decision, contradicts what was asked, or leaves behavior genuinely undefined) — stop and ask the user rather than guessing. Don't silently invent new architecture, new components, or new theme tokens.

## Constraints

- **Never expand scope beyond what was agreed.** If you discover an adjacent issue, mention it — don't fix it in the same change unless asked.
- **Never remove public interfaces** (exported types, route paths, env keys, Server Action exports) unless explicitly asked to.
- **Never generate `pages/` directory files** — App Router only.
- **Never generate `useStyles` hooks, `StyleSheet.create` blocks, or anything from another stack.**
- **Never access `process.env.X` directly** — route through `src/env.ts`.
- **Never commit on your own** — implementing code and committing it are separate steps; see [Commit Changes](../commit-changes/SKILL.md) for the git workflow, and only run it when the user asks.
- **Prefer the minimal correct change.**
