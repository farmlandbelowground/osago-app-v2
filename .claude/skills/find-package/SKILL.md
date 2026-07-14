---
name: find-package
description: Research and recommend the best solution before implementing a helper, utility, or any functionality that might already exist locally or as a package — local reuse first, then Next.js / React built-ins, then a vetted npm package, and only then a custom implementation.
---

# Find Package Skill

This skill prevents reinventing the wheel. Before implementing any utility, helper, formatter, or integration from scratch, it runs a parallel research phase to find the best existing solution — local reuse, a Next.js / React built-in, or a vetted third-party package.

## When to Use

When the user is about to (or has just) written a helper function or utility that:

- Formats or transforms data (dates, timers, currency, phone numbers, file sizes, etc.)
- Wraps a browser or platform API (file uploads, geolocation, image handling, clipboard, etc.)
- Handles a cross-cutting concern (analytics, error reporting, deep linking, etc.)
- Duplicates logic that might already exist somewhere in the codebase

**Trigger phrases:** "add a helper for...", "implement a formatter for...", "write a utility that...", "I need a function to...", "how do I format...", "install something for..."

## Priority Order

Always resolve in this order — stop at the first match:

1. **Local reuse** — the implementation already exists in the codebase
2. **Ecosystem built-ins** — Next.js native capabilities (`next/image`, `next/link`, `next/font`, Server Actions, built-in middleware, `next/navigation`) and React built-ins (hooks, context)
3. **Vetted npm package** — installed via the project's package manager; prefer packages well-tested in the Next.js / React ecosystem (e.g. `zod`, `date-fns`, `clsx`, `tailwind-merge`)
4. **Custom implementation** — write from scratch only when options 1–3 are exhausted

Never propose a custom implementation without first confirming that options 1–3 were exhausted.

## Workflow

### Phase 1 — Parallel Research (2 agents)

Launch **2 Explore agents in parallel**:

#### Agent 1 — Codebase Search

Search the entire codebase for existing implementations:

1. Search for similar function names, patterns, or logic related to the requested functionality — use semantic search: if the request is "format a timer", search for `padStart`, `Math.floor`, `minutes`, `seconds`, timer, format
2. Check `src/shared/utils/`, `src/shared/helpers/`, and any feature-level `utils.ts` files under `src/features/<name>/`
3. Check `package.json` dependencies — is a relevant package already installed but unused for this use case?
4. Report:
   - **Found locally** → exact file path, function name, and a code snippet
   - **Package already installed** → package name and relevant API
   - **Not found** → confirm with a list of searched locations

#### Agent 2 — Package Research

Research available packages for the requested functionality:

1. **Check Next.js native capabilities first** — search Next.js docs (`nextjs.org/docs`) and React docs. Next.js often covers the use case without a third-party package — `next/image` for image optimization, `next/font` for font loading, `next/link` for client-side navigation, Server Actions for mutations, middleware for request interception, `next/navigation` for client-side routing helpers. Many cross-cutting concerns (caching, revalidation, streaming) are first-class Next.js features — check before reaching for npm.
2. **Check the npm registry for popular Next.js / React packages** — filter by weekly downloads, last-published recency, TypeScript support, and Next.js compatibility (no SSR-incompatible globals, App Router compatibility). Examples: `zod` (validation), `date-fns` (dates), `clsx` + `tailwind-merge` (className composition), `@t3-oss/env-nextjs` (env validation), `@tanstack/react-query` (client-side data), `lucide-react` (icons).
3. **General JS/TS ecosystem** — universal packages with no Next.js-specific concerns (e.g. pure utility libraries)

For each candidate, report:

- Package name and current version
- Weekly downloads (signal of community adoption)
- Last published date (signal of maintenance)
- Whether it is compatible with React Server Components / App Router / Server Actions; whether it pulls in `window`/`document` globals that break SSR
- The specific API that covers the requested use case (with a brief code example)

### Phase 2 — Recommendation

After both agents complete, compile a recommendation following the priority order above.

#### If found locally:

```
[OK] Already exists in the codebase

File: src/shared/utils/formatTimer.ts
Function: formatTimer(seconds: number): string

Recommendation:
- If used only in one feature -> keep it there, import via path alias
- If needed in 2+ features -> move to src/shared/utils/ and export via the shared barrel
```

#### If a Next.js built-in fits:

```
[Next.js] Native capability covers this

Capability: next/image
API: <Image src="..." alt="..." width={...} height={...} />

Recommendation: use next/image. No package install required; image optimization,
lazy loading, and responsive sizing are first-class Next.js features.
```

#### If a third-party npm package is best:

```
[npm] Recommended package: date-fns

Version: 3.6.0 | Downloads: 18M/week | Last published: 2 months ago
App Router / RSC compatible: Yes (pure ES modules; no window globals)

API for this use case:
  import { format } from 'date-fns';
  format(new Date(), 'mm:ss')

Alternatives considered:
  - moment.js — deprecated, large bundle size
  - dayjs — viable but date-fns is more tree-shakeable

Install: pnpm add date-fns   (npm install / yarn add — match the project's package manager)
```

#### If custom implementation is the right call:

```
[Custom] Custom implementation recommended

Reason: The logic is trivial (< 10 lines), domain-specific, and no package adds real value.

Placement:
  - Used in one feature -> src/features/<name>/utils.ts
  - Used in multiple features -> src/shared/utils/

See utils-and-environment.md for placement rules.
```

### Phase 3 — Confirm & Act

Present the recommendation to the user and **wait for confirmation** before:

- Installing a new package
- Moving an existing helper to a new location
- Implementing a custom solution

After confirmation:

- **If installing:** use the project's package manager (whichever lockfile is present — `pnpm-lock.yaml` / `package-lock.json` / `yarn.lock`); verify App Router + RSC compatibility (no `window`/`document` access at module load; no SSR-incompatible globals)
- **If reusing local:** refactor the import to use the shared location, delete the duplicate
- **If custom:** implement in the correct location per [Utils and Environment](../../../patterns/utils-and-environment.md)

## Important

- **Never install a package without user confirmation** — always show the recommendation first
- **Match the project's package manager exactly** — no native-module concern on web, but mixing lockfiles across a project is a real footgun
- **Bundle size matters** — for pure utility needs (formatting, math), prefer small focused packages (`date-fns`) over large monolithic ones (`moment`); prefer tree-shakeable ESM packages over CommonJS to minimize First Load JS
- **Duplication is a smell** — if Agent 1 finds a similar implementation, always prefer consolidation over a new install
