---
name: generate-site-map
description: Generate or refresh a business-flavored routes-and-pages overview for this Next.js project — a plain-language product inventory (routes, what the user does on each, navigation branches), not a technical audit. Hooks, Server Actions, queries, and other implementation detail are deliberately excluded.
---

# Generate Site Map Skill

Produces a plain-language inventory of the app: what each route/page lets the user do, and how navigation flows between them. Useful for onboarding, for a PM/BA who needs a product-level picture without reading code, or just to get your own bearings in an unfamiliar or fast-growing route tree.

## When to Use

- Getting oriented in an unfamiliar or fast-growing codebase
- The route list has visibly drifted from a previous site-map
- Producing a first-pass product overview for a PM / BA / new teammate
- For a greenfield project (no code yet), scaffolding an empty placeholder the team fills in as pages get built

## What This Skill Does NOT Produce

Intentionally minimal on the technical axis. It does **not** inventory client hooks, Server Actions, RSC queries, API route handlers, middleware, third-party integrations, or component trees. That belongs in code comments, ADRs, or wherever this project documents its architecture — not here. This stays a product-level document.

## Workflow

### Step 1 — Detect Mode

- **Greenfield** — `app/` has no `page.tsx` files, or only a placeholder root page. Skip to Step 4 with a placeholder body.
- **Existing project** — `app/` has a meaningful route tree. Continue to Step 2.

### Step 2 — Survey Routes and Pages

Launch an Explore agent (or do it directly for a small app) with this scope:

> Survey the project's `app/` directory tree. For every `page.tsx`, produce a row containing:
>
> - **Route path** — the URL the user navigates to (e.g. `/`, `/dashboard`, `/blog/[slug]`, `/(auth)/login`); route groups noted but excluded from the URL path itself
> - **Page name** — derived from the directory and route-segment naming (e.g. `LoginPage`, `DashboardPage`)
> - **One sentence, plain user-facing language** describing what the user does on that page — derived from the route segment, directory, and any obvious page title/metadata. Do NOT inspect hooks, Server Actions, queries, or imports. Stay descriptive of user behavior: "Sign in with email", "See an overview of the user's dashboard", "Read a single blog post"
> - **Containing route group** — `(auth)`, `(app)`, `(marketing)`, or none — and briefly what user flow it gates
> - **Dynamic segment** — `[slug]`, `[id]`, `[...rest]` — and what entity it represents at the product level
> - **Special files alongside `page.tsx`** — `loading.tsx`, `error.tsx`, nested `layout.tsx` — just note presence
>
> Also produce a brief description of the top-level navigation branches in user-facing terms (e.g. "Marketing site: landing, pricing, about"; "Authenticated app: dashboard, settings, billing"; "Auth: sign-in / sign-up / password reset").

Do not enumerate hooks, Server Actions, fetch calls, integrations, or middleware — if the agent's output contains any, discard that part when composing the doc.

### Step 3 — Compose the Document

```markdown
# <project-name> — Site Map

> A product-level inventory of this project's routes. Regenerate via the `generate-site-map` skill when the route tree changes meaningfully. Technical detail (hooks, Server Actions, queries, integrations) belongs elsewhere — this stays a product picture.

## Routes and Pages

| Route | Page | What the user does here |
|-------|------|--------------------------|
| `<route>` | `<PageName>` | <one sentence, user-facing> |

## Navigation Branches

- **<Branch name>**: <what the user does in this branch — entry point, main steps, exit conditions>
```

For greenfield mode, produce the same structure with the Routes and Pages table empty (a single placeholder row: "_No routes yet — re-run this skill once the app has its first `page.tsx`._") and Navigation Branches as a one-line placeholder.

### Step 4 — Write the File

Write to `docs/site-map.md` by default (or wherever the user specifies). If the file already exists, overwrite the Routes and Pages table and Navigation Branches section, but **preserve any other content a human has added** (a product-vision paragraph, notes, roadmap items) — this skill only regenerates the code-derived sections.

### Step 5 — Report Back

- Path written
- Mode (greenfield / existing-project)
- Count of routes / pages documented

## Important

- **Stay product-level.** No hooks, Server Actions, queries, integrations, or dependency mentions.
- **Never fabricate routes.** If a folder under `app/` has no `page.tsx`, omit it — don't invent a description.
- **Never overwrite human-added prose** in the file — only the Routes/Pages table and Navigation Branches are regenerated.
- **Output vocabulary is Routes and Pages**, not "Screens" — that term belongs to native-app conventions, not a web app.
