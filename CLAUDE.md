@AGENTS.md

## Purpose

This file is the single source of truth for AI-assisted development conventions on this stack. It, together with `rules/`, `patterns/`, and `.claude/skills/`, travels with the project so conventions are defined once and reused across sessions instead of re-explained every time.

## Styling Exception: Legacy CSS Classes Instead of Tailwind

**Overrides [Styling](rules/styling.md) and [Styling with Tailwind](patterns/styling-tailwind.md) below, for migrated code.** UI components ported during the `osago-app` → `osago-app-v2` migration (see `../docs/migration-plan.md`) use the plain CSS classes ported verbatim from the legacy app's `styles.css` into `src/app/globals.css` (e.g. `.btn`, `.field`, `.card`, `.main`) — **not** Tailwind utility classes — even though the Tailwind packages, `cn()` helper, and lint plugin remain installed.

This began as a temporary migration-speed tradeoff whose exit was a final Tailwind-conversion pass (Slice 15). **Slice 15 was cancelled (2026-07-23):** the migrated code keeps its legacy `styles.css` classes permanently, and Tailwind (`rules/styling.md` / `patterns/styling-tailwind.md`) applies to **net-new UI features only**. The `better-tailwindcss/no-unregistered-classes` lint override stays in place. See `../docs/migration-plan.md` §1.3 for the full rationale.

## Stack

Next.js App Router, TypeScript (strict mode), React Server Components by default with `'use client'` opt-in, Server Actions for mutations, native `fetch` + Zod for validation at every boundary, per-feature raw Zustand for client state, Tailwind CSS via a `cn()` helper (clsx + tailwind-merge) for styling, `@t3-oss/env-nextjs` for environment validation, React Hook Form + Zod resolver for complex forms, path aliases (`@/*`, `@features/*`, `@shared/*`). Adapt the specifics to your own project's actual choices — the structure and discipline below are what matters, not any single library.

## Development Principles

- Clean, feature-oriented architecture — business logic separated from UI
- Small, reusable components with a single zone of responsibility
- Strict typing everywhere — no `any`
- No duplicated code; composition over inheritance
- Don't refactor unrelated code while making a change

## How Conventions Are Organized

Nothing below is auto-loaded into every session. Claude reads only the `rules/` and `patterns/` files relevant to the task at hand, and reaches for a skill in `.claude/skills/` when a task matches one.

- **`rules/`** — cross-cutting conventions each project must follow
- **`patterns/`** — reusable implementation patterns with worked examples
- **`.claude/skills/`** — task-specific workflows (auditing, running the project, committing, code review, package research, etc.)

### Conventions for Working with These

- **Convention questions load the governing rule before answering.** If asked "why is this built this way" or "why not approach X", read the relevant file(s) in `rules/` or `patterns/` first — never answer from general knowledge while the governing rule sits unread.
- **Keep rules and patterns focused.** Each file covers one topic; don't mix concerns within a single file.
- **Prefer an existing skill over ad hoc steps.** If a task matches one of the skills below, use it instead of reinventing the workflow inline.
- **English for all artifacts.** Code, comments, commit messages, and PR bodies are written in English; conversational replies can match the user's language.
- **Default to no code comments.** A comment earns its place only by recording a load-bearing *why* the code cannot carry — see [Code Comments](rules/code-comments.md).

## Rules

Cross-cutting conventions, several with `paths:` frontmatter naming the files they govern (advisory selection metadata, not an auto-load trigger — apply the rule when your task touches matching files):

- [Code Style](rules/code-style.md) — formatting, braces, naming, spacing, restrictions, Next.js-specific directive placement
- [Code Comments](rules/code-comments.md) — default no comment, load-bearing *why* only, rationale goes in the PR description, never names internal process/tasks
- [Typing](rules/typing.md) — `interface` vs `type`, strict TS, component signatures, no `any`
- [Imports](rules/imports.md) — path aliases, import order, named-exports-only, barrel discipline
- [API](rules/api.md) — native `fetch` + Zod validation at every boundary; request helper pattern
- [Constants](rules/constants.md) — no module-level literals in component/helper files; `constants.ts` placement and typing
- [Data Fetching](rules/data-fetching.md) — the three-way decision matrix: RSC fetch vs Server Actions vs TanStack Query
- [Forms](rules/forms.md) — simple (`useActionState`) vs complex (React Hook Form + Zod resolver) decision matrix
- [RSC vs Client Components](rules/rsc-vs-client.md) — Server Components by default; the `'use client'` trigger list; boundary discipline
- [Server Actions](rules/server-actions.md) — `'use server'`, Zod input validation, discriminated-union returns, cache invalidation
- [State Management](rules/state.md) — per-feature raw Zustand; persist middleware opt-in; selector discipline
- [Styling](rules/styling.md) — Tailwind as the sole styling mechanism, theme tokens, no hardcoded hex, no inline styles except dynamic values

## Patterns

Reusable implementation patterns with worked examples:

- [Directory Structure](patterns/directory-structure.md) — `app/` as routing manifest, `src/features/`, `src/shared/`, path aliases
- [Page and Layout](patterns/page-and-layout.md) — `page.tsx`/`layout.tsx` anatomy, route groups, focused domain-named hooks (never a monolithic logic hook)
- [Component Decomposition](patterns/component-decomposition.md) — when to split, single zone of responsibility, local vs shared, RSC/client boundary as a decomposition axis
- [Custom Hook Typing](patterns/custom-hook-typing.md) — `Result` interface, `UseHookName` type alias, one folder per hook
- [Queries in RSC](patterns/queries-in-rsc.md) — `queries.ts` colocation, caching strategy selection, parallel fetching
- [Server Actions](patterns/server-actions.md) — `actions.ts` colocation, simple vs complex form flow, cache invalidation
- [Hooks and Query](patterns/hooks-and-query.md) — TanStack Query for client-reactive data only; custom-hook wrapping; query keys
- [Loading](patterns/loading.md) — `loading.tsx` auto-`<Suspense>`, explicit streaming boundaries, skeleton vs spinner
- [Error Boundary](patterns/error-boundary.md) — `error.tsx` per segment, `global-error.tsx` at root, `notFound()` / `not-found.tsx`
- [Metadata and SEO](patterns/metadata-and-seo.md) — static `metadata` export, `generateMetadata`, Open Graph/Twitter cards
- [Styling with Tailwind](patterns/styling-tailwind.md) — CSS-first `@theme` tokens, `cn()`, dark mode, class-proliferation strategy
- [Environment Validation](patterns/environment-validation.md) — `src/env.ts`, `createEnv` schema shape, `NEXT_PUBLIC_` prefix convention
- [Utils and Environment](patterns/utils-and-environment.md) — pure helpers never live inside hooks; scope decision table; barrel discipline
- [Assets and Icons](patterns/assets-and-icons.md) — SVG-as-component icons, `next/image` for raster assets, `public/` vs bundled assets
- [Common Commands](patterns/commands.md) — dev/build/start, lint/type-check/test, dependency management

## Skills

Task-specific workflows in `.claude/skills/` — reach for these instead of reinventing the workflow inline:

- **`audit-project`** — full project audit against all rules and patterns; produces a findings report, then applies fixes after approval
- **`run-project`** — start, build, run in production, lint, format, or type-check the project
- **`implement-code`** — implementation mechanics for greenfield creation, refactoring, or design-derived pages; encodes the RSC/client, Server Action, styling, state, typing, and import conventions above
- **`quick-fix`** — discipline for small, low-risk changes (typo, copy tweak, dead-code removal, one-line bug fix): minimal diff, still respects every rule and pattern, verify, no scope creep
- **`find-package`** — research existing local implementations and packages (local reuse first, then framework built-ins, then a vetted package, only then a custom implementation) before writing a new helper or utility
- **`analyze-figma`** — extract a Figma frame via MCP and produce an exhaustive raw-data design-export document (colors, fonts, spacing, layout tree, interactive elements)
- **`generate-site-map`** — generate or refresh a business-flavored routes-and-pages overview: a plain-language product inventory, not a technical audit
- **`commit-changes`** — organize uncommitted changes into logical commits, then — only with explicit confirmation at each step — push and open a PR
- **`build-pr-narrative`** — assemble a clean, product-focused PR body (Summary, Test Plan, optional Notes)
- **`review-pull-request`** — fresh-context code review of a pushed PR against this project's rules and patterns; findings graded Blocking / Important / Nit
