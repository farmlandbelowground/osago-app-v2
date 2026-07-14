---
name: commit-changes
description: Organize uncommitted changes into logical commits, then — only with explicit confirmation at each step — push and open a PR. Never rolls all three steps into one unconfirmed action.
---

# Commit Changes Skill

Turns a working tree full of changes into well-organized commits, then pushes and opens a PR — each of those three actions gated by an explicit go-ahead from the user. Depends only on `git`, the GitHub CLI (`gh`), and this project's own conventions.

## When to Use

When the user asks to commit, push, or open a PR for the current changes.

## Prerequisites

- `git` available in the working directory
- `gh` CLI — recommended but not required:
  - Used to resolve the repo's default branch. If unavailable, fall back to `git remote show origin` or ask the user.
  - Required for opening a PR — without it, skip that step and tell the user to run `gh auth login` or open the PR manually on GitHub.
  - Committing and pushing work fine without `gh`.

## Workflow

### Step 1 — Branch Safety Check

```bash
DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')
CURRENT_BRANCH=$(git branch --show-current)
```

Also treat common protected branch names (`main`, `master`, `dev`, `develop`, `staging`, `production`, `release`) as protected, even if `gh` isn't available to confirm the default.

**If the current branch is the default or another protected branch:**
1. Inspect the changes first (Step 2) to understand the dominant type of work
2. Derive a branch name: `<type>/<short-topic>` in kebab-case (`feat/`, `fix/`, `refactor/`, `chore/`, `docs/`, `style/`, `test/`, `types/`)
3. `git checkout -b <branch-name>`
4. Tell the user which branch was created and why

**If already on a feature branch:** proceed to Step 2.

Never commit directly to a protected branch.

### Step 2 — Discover Changes

```bash
git status
git diff
git diff --cached
```

Build a complete picture — both staged and unstaged — before grouping anything.

### Step 3 — Analyze and Group

Group changes by logical intent, using [Conventional Commits](https://www.conventionalcommits.org/) types:

| Type | Covers |
|------|--------|
| `feat` | New functionality |
| `fix` | Bug fixes |
| `refactor` | Restructuring without behavior change |
| `style` | Formatting / linting, no logic change |
| `chore` | Deps, config, tooling |
| `docs` | Documentation, `CLAUDE.md`, `README` |
| `test` | Tests added or modified |
| `types` | Type definitions, interfaces |
| `assets` | Images, fonts, static files |

- Group by feature when changes span a single feature
- Keep lockfile changes with the feature that required them, or standalone if unrelated
- Keep config changes (`tsconfig`, ESLint, build config) in their own commit unless tightly coupled to a feature
- If only one logical group exists, make a single commit — don't split artificially

### Step 4 — Handle Files With Mixed Changes

A single file may contain changes that logically belong to two groups (a bug fix plus an incidental cleanup in the same file).

**Preferred — commit the whole file under the dominant group.** This is almost always the right call: pick the group describing the majority of the file's changes, commit it whole, and let the commit message + diff explain the minor piggy-backed part.

**Only if genuinely large and unrelated** — use patch-based staging:

```bash
git diff -- <file> > /tmp/mixed.patch
# edit the patch to keep only the hunks for group A
git apply --cached /tmp/mixed.patch
# commit group A, then repeat for group B with the remaining hunks
```

Don't use `git add -p` — it's interactive and unreliable in an automated flow. If the split is too error-prone, ask the user for guidance instead of forcing it.

### Step 5 — Commit Each Group

For each group:
1. Stage only the relevant files: `git add <file1> <file2> ...` — never `git add .` / `git add -A`
2. Verify: `git diff --cached --stat` and `git diff --cached`
3. Write the message — Conventional Commits format, imperative mood, under 72 characters, no trailing period
4. Commit

### Step 6 — Present the Commits, Confirm Before Pushing

```bash
git log --oneline -10
```

Show the user the resulting commit list. **Wait for explicit confirmation before pushing** — do not proceed to Step 7 on your own initiative.

### Step 7 — Push (only after confirmation)

Re-check the branch before pushing — never push to a protected branch:

```bash
CURRENT_BRANCH=$(git branch --show-current)
```

If `$CURRENT_BRANCH` matches a protected name, refuse and explain: the commits exist locally, but pushing to a protected branch needs a different branch first.

```bash
git push -u origin "$CURRENT_BRANCH"
```

If the push is rejected (non-fast-forward, branch protection), do **not** force-push — report the error and ask how to proceed.

### Step 8 — Pull Request (only after the user asks for one)

#### 8.1 — Determine the Base Branch

```bash
BASE_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')
```

#### 8.2 — Detect a PR Template

Check, first match wins:
1. `.github/pull_request_template.md`
2. `.github/PULL_REQUEST_TEMPLATE.md`
3. `.github/PULL_REQUEST_TEMPLATE/pull_request_template.md` (if multiple, ask the user which to use)
4. `docs/pull_request_template.md`
5. `pull_request_template.md` (repo root)

#### 8.3 — Assemble the PR Body

Delegate to the [Build PR Narrative](../build-pr-narrative/SKILL.md) skill to produce the body (Summary / Test Plan / Notes, merged into the template if one exists).

#### 8.4 — Create the PR

```bash
gh pr create \
  --base "$BASE_BRANCH" \
  --title "<concise PR title under 70 chars>" \
  --body "$(cat <<'EOF'
<assembled body>
EOF
)"
```

Return the PR URL to the user.

## Edge Cases

- **Generated files** (lockfiles, generated types) — commit alongside the change that caused them; never resolve or regenerate mid-commit
- **Large refactors touching many files** — one commit with a clear scope description often beats artificial splitting
- **Merge conflicts** — resolve deliberately; never blindly take "ours" or "theirs" without checking what's actually being discarded
- **Lint or type-check hooks fail on commit** — fix the reported issue and create a new commit; never bypass with `--no-verify`, never amend a previous commit as a shortcut (a failed hook means the commit didn't happen, so amending would target the wrong commit)
- **Missing or unauthenticated `gh`** — commit and push proceed normally; skip the PR step and tell the user to run `gh auth login`

## Quality Checks

Before each commit:
- Only intended files are staged (`git diff --cached --stat`)
- The commit message accurately reflects the staged diff
- No unrelated files slipped in
- No secrets staged (`.env`, credentials, private keys) — if detected, stop and alert the user immediately

## Important

- **Never push without explicit confirmation of the commit list first.**
- **Never open a PR without the user asking for one.**
- **Never force-push.**
- **Never commit directly to a protected branch.**
