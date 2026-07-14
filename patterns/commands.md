# Common Commands

Examples below use **pnpm** — swap in `npm`/`yarn` equivalents if that's what your project uses; keep one package manager per project.

## Development

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the development server with hot reload |
| `pnpm build` | Production build |
| `pnpm start` | Start the production server (after `pnpm build`) |

`pnpm dev` is the day-to-day command. It runs Next.js in development mode with file watching, hot module replacement, and the Fast Refresh feedback loop. `pnpm build` produces an optimized production bundle. `pnpm start` runs the built bundle locally — useful for verifying production behavior before deploy.

## Quality

| Command | Purpose |
|---|---|
| `pnpm lint` | Run ESLint across the project |
| `pnpm exec tsc --noEmit` | TypeScript type-check without emitting |
| `pnpm test` | Run the project's test suite |

`pnpm lint` runs the project's ESLint config. `pnpm exec tsc --noEmit` runs the TypeScript compiler in type-check-only mode — no JavaScript output, only type errors surfaced. `pnpm test` is a placeholder — the specific testing convention (Jest, Vitest, Playwright, Testing Library) is a per-project decision.

## Dependency Management

| Command | Purpose |
|---|---|
| `pnpm add <pkg>` | Install a runtime dependency |
| `pnpm add -D <pkg>` | Install a dev dependency |
| `pnpm remove <pkg>` | Uninstall a dependency |
| `pnpm update` | Update dependencies per `package.json` ranges |

`pnpm update` respects the version ranges in `package.json`; to deliberately bump a major version, edit `package.json` first or pass an explicit version (`pnpm add some-package@^2.0.0`).

## pnpm exec — Run Local Binaries

To run a binary installed locally as a project dependency, use `pnpm exec <bin> <args>`.

| Command | Purpose |
|---|---|
| `pnpm exec tsc --noEmit` | Run the locally installed TypeScript compiler |
| `pnpm exec eslint .` | Run the locally installed ESLint binary |
| `pnpm exec next info` | Run the locally installed Next.js CLI |

`pnpm exec` is the canonical way to invoke any binary that lives under the project's `node_modules/.bin/`. It guarantees the same version every team member has installed in `package.json`, rather than whatever version happens to be globally available.

See [directory-structure.md](./directory-structure.md) for where the project files these commands operate on actually live.
