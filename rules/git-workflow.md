# Git Workflow

How to branch, commit, sync, and push on this repo so parallel work merges cleanly. This is the **convention** layer — the actual commit/push/PR mechanics live in the [`commit-changes`](../.claude/skills/commit-changes/SKILL.md) skill, which this rule points to rather than repeats.

## Why this still matters in a feature-oriented codebase

The app is split by feature (`src/features/*`), so two people on different features rarely touch the same file — conflicts are far less common here than in a single-file app. But they are not gone. They cluster in a handful of **shared files** that many features edit (see [Shared-file hotspots](#shared-file-hotspots)), and any branch that drifts from the default for days will conflict regardless of how well the code is split. The discipline below keeps both problems small.

## The rules (cheat sheet)

1. **Sync before you push** — always `git pull --rebase` right before pushing.
2. **One branch per task** — never work directly on the default branch.
3. **Small, focused commits** — one logical change each, Conventional Commits format.
4. **Push in short cycles** — every 30–60 min, not one giant end-of-day diff.
5. **Short-lived branches** — hours, not days. Rebase, push, merge, delete.
6. **Whoever touches a shared hotspot pushes first** — others rebase on top.

## One-time setup (once per machine)

Make a plain `git pull` rebase instead of creating merge commits, and confirm your identity is set:

```bash
git config pull.rebase true
git config user.name "Your Name"
git config user.email "you@example.com"
```

On Windows, also read [The line-ending trap](#the-line-ending-trap-windows) — it prevents a class of "the whole file looks changed" conflicts.

## The core flow

### 1 — Start fresh from the default branch

```bash
git checkout main            # or the repo's actual default branch
git pull --rebase
git checkout -b feat/short-task-name
```

Branch names follow the `commit-changes` convention: `<type>/<short-topic>` in kebab-case, where `<type>` is a Conventional Commit type — `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`, `style/`, `test/`, `types/`. One branch = one task; don't reuse a branch for unrelated work.

### 2 — Commit in small, focused steps

Each commit is one logical change. Messages are English, imperative mood, Conventional Commits format, under 72 characters, no trailing period:

```bash
git add src/features/leads/components/LeadExportButton/LeadExportButton.tsx
git commit -m "feat(leads): add export button to leads list"
```

Stage only the files for the change — never `git add .` / `git add -A`. Let the [`commit-changes`](../.claude/skills/commit-changes/SKILL.md) skill do the grouping when a working tree holds several unrelated changes.

### 3 — Push in short cycles

Don't let a large diff pile up for hours. Push roughly every 30–60 minutes or whenever a piece is done — and always sync first:

```bash
git pull --rebase
git push -u origin feat/short-task-name
```

### 4 — Open a PR and merge

Use [`build-pr-narrative`](../.claude/skills/build-pr-narrative/SKILL.md) for the PR body and [`review-pull-request`](../.claude/skills/review-pull-request/SKILL.md) for review. Merge quickly and delete the branch — short-lived branches cause far fewer conflicts.

## Push order — never push on top of stale state

The golden rule: **never push without syncing first.**

```bash
git pull --rebase     # replays your work on top of the latest remote
git push
```

If `git push` is **rejected** ("Updates were rejected because the remote contains work that you do not have locally"), someone pushed while you were working. Do **not** force it — `git pull --rebase`, resolve any conflict, then push again.

When two people both have pending work in the same **shared hotspot**, agree on an order: whoever edits the hotspot pushes **first**; the second person rebases on top, resolves the small conflict, and pushes. This keeps the high-collision change un-pushed for the shortest time.

## Shared-file hotspots

These files are edited by many features, so they collide even when the feature code itself is far apart. Treat an edit to one of them as a small, early, standalone commit — push it before your bulky feature work.

| Hotspot | Why it collides | Habit |
|---|---|---|
| Barrel files (`index.ts`) | Every feature adds an export line | **Append** your export at the end, don't insert mid-list |
| `package.json` + `package-lock.json` | Any dependency change rewrites the lockfile | Keep dependency bumps in their own commit; regenerate the lockfile, never hand-merge it |
| `src/app/globals.css` | Shared legacy CSS classes + theme tokens | Append new rules; don't reorder existing blocks |
| Shared types (`src/shared/**`, `src/types/**`) | Cross-feature contracts | Append new members; coordinate real signature changes |
| `CLAUDE.md`, `rules/`, `patterns/` | Convention docs everyone updates | Small standalone `docs:` commits |

**Append, don't insert.** Two people appending to the end of the same list still conflict, but it's a tiny, obvious "keep both lines" resolution rather than a tangled one.

## When you hit a conflict

### 1 — Recognize it

Either `git push` is rejected (remote moved ahead), or `git pull --rebase` reports `CONFLICT (content): Merge conflict in <file>`. Run `git status` — the file shows under "Unmerged paths" / "both modified".

### 2 — Read the markers

Git inserts three markers. Example in a barrel `index.ts`:

```
export { LeadsTable } from './LeadsTable'
export { LeadFilters } from './LeadFilters'        // already on the branch you're landing on
export { LeadExportButton } from './LeadExportButton'   // your change
export { LeadDetail } from './LeadDetail'
```

- Between `<<<<<<< HEAD` and `=======` → the version already on the branch you're landing on.
- Between `=======` and `>>>>>>>` → **your** change.

### 3 — Resolve it: keep BOTH intents

> Most conflicts here are two people each **adding** something (an export, a field, an action). The correct resolution is almost always to **keep both** and delete the three marker lines.

```
export { LeadsTable } from './LeadsTable'
export { LeadFilters } from './LeadFilters'
export { LeadExportButton } from './LeadExportButton'
export { LeadDetail } from './LeadDetail'
```

Only pick one side when the two changes are genuinely the *same thing done two ways* — and if unsure, ask the other person before discarding their work.

**Resolving through Claude Code** — you don't have to edit markers by hand:

> *"I have a merge conflict in `<file>`. Resolve it by keeping both changes — don't discard either side. Remove the conflict markers and show me the resolved section so I can confirm."*

If the two sides genuinely overlap, ask Claude to explain each side before deciding. Always read what it produced — you own the resolution, not the tool.

### 4 — Verify BEFORE you finish

Never push a half-resolved file. Check all three:

1. **No markers remain** — search the file for `<<<<<<<`, `=======`, `>>>>>>>`.
2. **It still passes** — `npm run typecheck` and `npm run lint`; `npm run build` for anything non-trivial. (Don't run `npm run format` repo-wide — see [`commands`](../patterns/commands.md) and the [`run-project`](../.claude/skills/run-project/SKILL.md) skill.)
3. **The diff makes sense** — `git diff`, or ask Claude to summarize the final change.

Then finish and push:

```bash
git add <file>
git rebase --continue        # if rebasing  (or: git commit, if merging)
git push
```

> **Escape hatch:** if it goes sideways, `git rebase --abort` (or `git merge --abort`) puts you back exactly where you started. Nothing is lost — try again.

## The line-ending trap (Windows)

If `git status` or a conflict shows the **entire file as changed** (thousands of lines you didn't touch), it's almost certainly line endings (CRLF vs LF), not your work.

This repo currently has **no `.gitattributes`**, so normalization depends on each person's local Git and editor. One mismatched setting can rewrite a whole file and create a giant, fake conflict.

**If you see this:** do **not** force-push or try to "resolve" thousands of lines. Stop and flag it — it needs a one-time repo fix, not a manual merge.

**One-time fix (for whoever owns the repo):** add a `.gitattributes` with `* text=auto eol=lf` and re-normalize once. After that, line endings are consistent for everyone and this class of conflict disappears. Confirm before applying — it's a repo-wide change.

## Relationship to the skills

This rule is the **policy**; the skills are the **procedure**. Don't duplicate steps here — reach for the skill:

- [`commit-changes`](../.claude/skills/commit-changes/SKILL.md) — organize changes into logical commits, then (only with explicit confirmation at each step) push and open a PR. Includes branch-safety checks and never force-pushes.
- [`build-pr-narrative`](../.claude/skills/build-pr-narrative/SKILL.md) — assemble the PR body.
- [`review-pull-request`](../.claude/skills/review-pull-request/SKILL.md) — review a pushed PR against this project's rules and patterns.
