---
name: quick-fix
description: Discipline for small, low-risk changes (typo, copy tweak, dead-code removal, one-line bug fix) — apply the minimal diff, respect every project rule and pattern anyway, verify, and don't scope-creep.
---

# Quick Fix Skill

For changes small enough that a full [Implement Code](../implement-code/SKILL.md) pass would be overkill — a typo, a copy change, an obviously dead import, a one-line bug fix. The only thing that's "quick" here is the ceremony, not the craft: every project rule and pattern still applies.

## When to Use

The change is small and low-risk: a handful of lines, one or two files, no new public API, no new architecture. If mid-change you discover it's actually bigger than it looked, stop and say so rather than quietly expanding scope — switch to the full [Implement Code](../implement-code/SKILL.md) workflow instead.

## Workflow

### Step 1 — Load Only What's Relevant

Don't load the whole rule set. Load only what directly touches the change:

- The file(s) being changed, in full
- Whichever rule(s) the change actually touches (formatting → [code-style](../../../rules/code-style.md); types → [typing](../../../rules/typing.md); imports → [imports](../../../rules/imports.md); styling → [styling](../../../rules/styling.md))
- [Code Comments](../../../rules/code-comments.md) whenever the fix adds or edits any code — a quick fix must not leave, add, or reword-and-keep an essay comment

### Step 2 — Apply the Change

- The minimal diff that satisfies the request — nothing more
- Do not refactor adjacent code, even if it's tempting
- Do not add comments explaining the fix (default: no comment — see [Code Comments](../../../rules/code-comments.md))
- Do not add tests unless explicitly asked

If you discover the change actually requires touching a public API, spans far more files than expected, or needs a new type/component — stop. Say so, and suggest switching to the full [Implement Code](../implement-code/SKILL.md) workflow instead of pushing through.

### Step 3 — Verify

- Run the project's lint script (see `package.json`) — zero errors
- Run a TypeScript check (`npx tsc --noEmit`) — zero errors

If verification fails, fix within scope. If it reveals a deeper problem, stop and flag it rather than absorbing it into this change.

### Step 4 — Report Back

- Files changed
- One-sentence summary (suitable as a commit message)
- Confirmation that lint + type-check passed
- Suggested commit type: `fix` / `chore` / `style` / `docs` / `refactor` — if the change implies `feat` or something more substantial, it probably wasn't quick-fix-eligible to begin with

**Do not commit on your own.** Report back; the user decides when to commit — see [Commit Changes](../commit-changes/SKILL.md).

## Important

- **Every project rule still applies.** This is "fix without the ceremony," not "fix without the care."
- **If scope grows mid-fix, escalate — don't absorb it silently.** That's how a one-line typo fix becomes a 12-file change.
- **Never skip verification**, even for a one-character change.
- **Never commit on your own.**
