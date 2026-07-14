---
name: run-project
description: Start, build, run in production, lint, format, or type-check this Next.js / TypeScript project
---

# Run Project Skill

Maps a natural-language request to the correct `npm` command and waits for explicit confirmation before running anything non-trivial.

## When to Use

When the user asks to:
- Start / launch / run the project locally
- Build for production
- Start the production server (after a build)
- Run the linter (with or without autofix)
- Format code (with or without check-only mode)
- Type-check

There is no iOS, Android, Metro bundler, Expo, or simulator/emulator concept on this stack — if the user references any of those, the project may have been confused with a different codebase; surface the question rather than silently mapping it to something.

## Intent Mapping

This project's `package.json` defines:

| User intent | Command |
|---|---|
| Start dev server / run locally / "run the app" | `npm run dev` |
| Build for production | `npm run build` |
| Start production server (after build) | `npm run start` |
| Lint / "check the code" | `npm run lint` |
| Lint with autofix | `npm run lint:fix` |
| Format code | `npm run format` |
| Check formatting without writing | `npm run format:check` |
| Type-check / "run tsc" | `npx tsc --noEmit` (no dedicated `package.json` script for this) |

There is currently no test script in `package.json`. If the user asks to run tests and one gets added later, prefer whatever script name the project defines (e.g. `npm test` / `npm run test:e2e`) over assuming one.

## Build Output Location

`npm run build` produces output in **`.next/`** at the project root (gitignored, regenerated every build). `npm run start` reads from there.

## `npm run start` vs `npm run dev`

`npm run start` runs the **production server** and requires `npm run build` to have already run — it does not start hot-reloading dev mode. If the user says "start the app" without further context, default to `npm run dev` unless they explicitly mean serving a production build.

## Common Pitfalls

- Don't run `npm run dev` and `npm run start` at the same time — both bind port 3000 by default.
- Don't run `npm run start` before a `npm run build` has produced a fresh `.next/`.
- Don't chain build + start for the user without confirmation — propose each step individually unless they've clearly asked for the combination.
- Don't invoke `next` or `tsc` directly — use the `npm run` script / `npx` so the project's pinned versions are used.

## Workflow

1. Analyze the request and match it to a command above.
2. If ambiguous ("start the app", "check it", "test it"), ask which command they mean rather than guessing.
3. Propose the exact command and what it does.
4. Wait for confirmation before running anything that isn't a quick, side-effect-free check.
5. Execute.

## Important

- **Never run build/start commands without explicit confirmation** — a build can take real time and there may be timing reasons the user cares about.
- **npm only** — this project has no `pnpm-lock.yaml` or `yarn.lock`; don't propose `pnpm` or `yarn` equivalents.
- **Respect scripts this project adds later** — if `package.json` grows new scripts (tests, storybook, db migrations), surface them when relevant instead of reinventing the workflow.
- See [Common Commands](../../../patterns/commands.md) for the general pattern this project's scripts follow.
