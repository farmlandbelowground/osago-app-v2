---
name: review-pull-request
description: Fresh-context code review of a pushed pull request against this project's own rules and patterns. Produces findings (Blocking / Important / Nit) with recommended fixes. Run on explicit request; supports multiple passes on the same PR.
---

# Review Pull Request Skill

A second-pass code review of a pushed PR's actual diff, done in a context deliberately free of the implementation conversation — the value here is a fresh set of eyes, not a rubber stamp of "I already know this is right because I wrote it."

## When to Use

When the user explicitly asks for a review of an open PR.

## Inputs

- PR number or branch name
- Pass number (1 for the first review; 2+ for a follow-up pass on the same PR, after fixes were pushed)

## Prerequisites

- The PR exists and is pushed to origin
- `gh` CLI is available and authenticated

## Workflow

### Step 0 — Load Full Context (the fresh-context mandate)

The value of this skill is fresh judgment. Load everything relevant before looking at the code:

1. Every file in `rules/` and `patterns/`
2. The root `CLAUDE.md` and anything relevant under `docs/`
3. If the PR implements something tracked under `specs/`, read the relevant spec file(s) for intended behavior and acceptance criteria
4. A prior `pr-review.md` for this PR, if one exists from an earlier pass — don't repeat findings already resolved

This load is the whole point of the skill. Don't cut corners here.

### Step 1 — Fetch the Diff

```bash
BASE=$(gh pr view <pr-number> --json baseRefName --jq '.baseRefName')
git diff $BASE...HEAD
git diff $BASE...HEAD --stat
gh pr view <pr-number> --json title,body,baseRefName,headRefName,url
```

Read the full diff — don't skip files. For large PRs, group by module and prioritize by severity, but still cover everything.

### Step 2 — Alignment Check

Before hunting for bugs, verify structural alignment:

| Check | Method |
|-------|--------|
| Scope fidelity | Does the diff match what the PR description says it does? No surprise files? |
| Acceptance criteria | If a spec exists for this work, does the code address every item? |
| Restrictions | Is anything changed that the spec (if any) explicitly marked out of scope? |
| Reuse discipline | For every new component / hook / helper, was reuse of an existing one genuinely considered? |

### Step 3 — Substantive Code Review

With alignment checked, review code quality against everything loaded in Step 0. Watch for:

- **Rule violations** — missing braces, wrong `type` vs. `interface`, hardcoded values instead of theme tokens, direct env access instead of the validated env module
- **Pattern violations** — page/layout structure, hook decomposition, barrel discipline
- **Potential bugs** — null handling, error paths, race conditions, side effects in render
- **Maintainability** — unnecessarily complex logic, missing types, magic numbers, duplicated logic that should be extracted

### Step 4 — Compose the Review

Sort findings into three severity buckets:

- **Blocking** — must be fixed before merge (correctness bugs, rule violations that break the architecture)
- **Important** — should be fixed, not merge-blocking on their own
- **Nit** — stylistic, optional

For each finding: exact file path + line number (or component name for structural findings), a clear statement of the observation, and the rule/pattern it violates (so the reviewer can verify independently).

Include a recommended-fixes list, ordered by dependency (types first, then hooks, then components, then barrels).

End with an overall recommendation: **approve** / **fixes requested** / **rework needed**.

If this is pass 2+, append a new dated section rather than starting over, and skip findings already resolved from the prior pass.

### Step 5 — Hand Off

Report back:
- Pass number
- Count of findings by severity
- Overall recommendation

## Important

- **Never push to the PR branch or merge the PR yourself.** Your output is the review; fixes and merging are separate, human-gated steps.
- **Never skip Step 0** — the fresh-context load is the entire value of this review.
- **Never re-litigate a design decision that was already agreed** — your scope is "did the code implement the intent faithfully", not "was the intent right".
- **Be honest about severity** — don't inflate nits to look thorough, and don't downgrade real blockers to avoid friction.
