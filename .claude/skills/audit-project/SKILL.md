---
name: audit-project
description: Full project audit of this Next.js / TypeScript codebase against the rules in `rules/` and the patterns in `patterns/`. Produces a findings report grouped by category with file paths and rule references, then — after the user approves the fix plan — applies the fixes and verifies.
---

# Audit Project Skill

Performs a full audit of the codebase against every rule in `rules/` and every pattern in `patterns/`, then (with explicit approval) fixes what it finds.

## When to Use

When the user asks to:
- Audit / check / verify the project against its own conventions
- Find rule or pattern violations across the codebase
- Clean up an area of the codebase that has drifted from convention
- Do a general code-quality pass before a release or a big PR

## Workflow

### Step 0 — Load Project Context

Before auditing, get oriented:

1. Read the project's root `CLAUDE.md` and anything under `docs/` for domain context, and any project-specific conventions or deliberate deviations from the standard rules/patterns.
2. If the audit is scoped to a specific feature or directory, read the relevant files under `specs/` (if any exist there) for the intended behavior.

### Phase 1 — Analysis

Launch **2 Explore agents in parallel** (or do both passes yourself if launching agents isn't warranted for a small scope), each with a specific focus. Skip this parallelization for a narrowly-scoped audit (e.g. "check this one file") — just read it directly.

#### Agent 1 — Architecture & Structure Audit

Check the project structure against:

- [Directory Structure](../../../patterns/directory-structure.md) — `app/` contains only Next.js App Router conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts`, dynamic segments, route groups) with no business logic beyond a thin async server-component shell; `src/features/<name>/` organized by domain; flat `src/shared/components/` (no atomic-tier subdirectories); `src/env.ts` for env validation; no `pages/` directory
- [Page and Layout Pattern](../../../patterns/page-and-layout.md) — `page.tsx` default-exported async function; `layout.tsx` nesting; `loading.tsx` Suspense fallback; `error.tsx` `'use client'` boundary with `reset` prop
- [Server Actions Pattern](../../../patterns/server-actions.md) — mutations in `features/<name>/actions.ts`; `'use server'` directive; Zod input validation; discriminated-union returns; `revalidatePath()` / `revalidateTag()`; `redirect()` on success
- [Queries in RSC Pattern](../../../patterns/queries-in-rsc.md) — server-side fetching colocated in `features/<name>/queries.ts`; native `fetch` with explicit `cache` / `revalidate`; Zod response validation; no Axios
- [Hooks & Query](../../../patterns/hooks-and-query.md) — focused, domain-named hooks (never a monolithic `useLogic`); TanStack Query where adopted
- [Custom Hook Typing](../../../patterns/custom-hook-typing.md) — every custom hook has a sibling `types.ts` with `Result` + `UseHookName`
- [Component Decomposition](../../../patterns/component-decomposition.md) — one zone of responsibility per component; splits happen at zone boundaries
- [Error Boundary](../../../patterns/error-boundary.md), [Loading](../../../patterns/loading.md), [Metadata and SEO](../../../patterns/metadata-and-seo.md), [Environment Validation](../../../patterns/environment-validation.md) — enforce verbatim

Report every structural violation with file paths.

#### Agent 2 — Code Quality & Conventions Audit

Check all `.ts` and `.tsx` files against:

- [Code Style](../../../rules/code-style.md) — the file is the source of truth for braces, naming, spacing, and formatting; don't restate it, enforce it
- [Code Comments](../../../rules/code-comments.md) — flag essay comments, comments restating code, and decision-rationale narration
- [Typing](../../../rules/typing.md) — `strict` discipline; interface vs type; no inline nested object types
- Styling — inline `style={{}}` only for genuinely dynamic values; no `useStyles` / `StyleSheet.create` (those are React Native patterns and have no place here)
- [Imports](../../../rules/imports.md) — path aliases used consistently; no relative `../../` when an alias covers the path; no nested barrel imports
- [Constants](../../../rules/constants.md) — logic-facing values extracted appropriately
- [State Management](../../../rules/state.md) — per-feature raw Zustand; `persist` opt-in only; no `AsyncStorage` (that's a React Native API)
- [API](../../../rules/api.md) — native `fetch` only, no Axios; Zod response validation; env via `src/env.ts`, never raw `process.env.X` at call sites
- [RSC vs Client](../../../rules/rsc-vs-client.md) — Server Components by default; `'use client'` pushed as far down the tree as possible
- [Data Fetching](../../../rules/data-fetching.md), [Server Actions](../../../rules/server-actions.md), [Forms](../../../rules/forms.md) — enforce verbatim

**Highest-signal violation categories:**

- Missing `'use client'` on components using hooks, event handlers, or browser APIs
- Raw `process.env.X` access instead of `src/env.ts`
- Server Actions accepting input without Zod validation
- Any `axios` import anywhere
- Nested barrel imports
- Leftover `useStyles` / `StyleSheet.create` artifacts

Report every code violation with exact file path and line content.

### Phase 2 — Plan Fixes

Compile a single fix plan:

1. Group violations by type (structural vs code quality)
2. Prioritize breaking issues first (missing `'use client'`, raw `process.env`, Axios, missing Zod validation), then conventions (import order, naming)
3. List every file that needs changes and what changes are needed
4. Present the plan to the user and wait for approval before touching anything

### Phase 3 — Apply Fixes

After approval, apply in this order:

1. Structural changes (file moves, missing barrels, removing forbidden subdirectories)
2. Type changes (`type` → `interface` where conventional, missing `types.ts` files)
3. Boundary fixes (`'use client'` additions / repositioning)
4. Style changes (removing inline styles that should be CSS classes)
5. API and env fixes (Axios → `fetch` + Zod, raw `process.env` → `src/env.ts`)
6. Server Actions fixes (Zod validation, discriminated-union returns, revalidation)
7. Code style changes (braces, naming, constants extraction)
8. Import changes (aliases, ordering, removing nested barrels)

**Before replacing any custom helper with a reimplementation**, run the [Find Package](../find-package/SKILL.md) workflow — prefer a battle-tested package or existing local utility over rewriting.

### Phase 4 — Verification

1. `npm run lint` — must pass with zero errors
2. `npx tsc --noEmit` — must pass with zero errors
3. Fix and repeat until both pass clean

Report the final status to the user.

## Important

- **Never apply fixes without user approval** — Phase 2 always presents the plan and waits
- **Do not skip Phase 4** — verification catches regressions from the fixes themselves
- **Handle large scopes incrementally** — if the violation count is very high, suggest fixing by feature module (one `src/features/<name>/` at a time)
- **Respect documented project-specific exceptions** — if `docs/` or the root `CLAUDE.md` documents a deliberate deviation, flag violations against that effective rule, not the raw template rule
- **The audited rule set is by-directory** — this skill references `rules/` and `patterns/` as the authoritative source; new files added there are picked up automatically without a skill update
