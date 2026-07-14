---
name: build-pr-narrative
description: Assemble a clean, product-focused pull request body — Summary, Test Plan, optional Notes — merged into the repo's PR template if one exists. Reads like a PR a careful engineer wrote by hand.
---

# Build PR Narrative Skill

Produces the body text for a pull request. The result reads like a clean, well-written product PR — no process jargon, no internal tooling references, nothing a teammate reviewing the PR wouldn't recognize as normal engineering communication.

## When to Use

Invoked by the [Commit Changes](../commit-changes/SKILL.md) skill right before `gh pr create`. Can also be used standalone whenever a PR body needs assembling.

## Inputs

- The current feature branch name and head commit
- The base branch (resolved by the caller, e.g. via `gh repo view --json defaultBranchRef`)

## Workflow

### Step 1 — Collect Branch Data

```bash
# Commits on this branch not yet on base
git log "$BASE_BRANCH"..HEAD --oneline

# Detailed commit info, for understanding the change (not for pasting verbatim)
git log "$BASE_BRANCH"..HEAD --format='%h %s%n%b%n---'

# Files changed
git diff --stat "$BASE_BRANCH"..HEAD
```

Use this to understand what changed and why — but **do not paste the commit list or diff stat into the PR body.** GitHub's own Commits / Files-changed tabs already show those; the body is a narrative, not a log.

### Step 2 — Detect a PR Template

Check, first match wins:
1. `.github/pull_request_template.md`
2. `.github/PULL_REQUEST_TEMPLATE.md`
3. `.github/PULL_REQUEST_TEMPLATE/pull_request_template.md`
4. `docs/pull_request_template.md`
5. `pull_request_template.md` (repo root)

### Step 3 — Assemble the Body

```markdown
## Summary

<2–5 sentences describing the change at the product/engineering level — what it does, why it exists, the user- or developer-observable behavior. Plain engineering language, no internal-process meta-talk.>

## Test Plan

<concrete, verifiable steps a reviewer or QA could actually follow>

- [ ] <verification step>
- [ ] Lint passes
- [ ] Type check passes

## Notes

<optional — include ONLY if there's a genuinely useful note for the reviewer: a risk area, a follow-up, a known limitation, a decision that needs buy-in. If you filled a small gap during implementation (e.g. "used the project's default spacing scale because the design didn't specify one"), mention it here in plain language. Omit this section entirely if there's nothing real to say.>
```

### Step 4 — Merge Into the Template (if one exists)

If the repo has a PR template, merge into it rather than discarding it:

1. Parse the template's headings and any HTML-comment instructions
2. Match template sections to the narrative:
   - "Summary" / "Describe your changes" / "Description" ← Summary
   - "Test plan" / "Testing" / "QA" / "Checklist before requesting a review" ← Test Plan (merge into the template's own checklist items where they overlap; leave the template's own items unchecked unless verifiably true)
   - "Context" / "Why" / "Motivation" ← merge into Summary prose, don't introduce a new section
   - "Issue ticket number and link" / "Ticket" / "Related issue" ← leave as-is (`N/A` if there's no ticket)
3. Preserve template sections that have no narrative match, verbatim
4. Append "Notes" only if it has real content
5. Never add sections beyond what the template has and what's listed above — the body stays product-focused

### Step 5 — Self-Check Before Returning

Read the assembled body back and confirm it reads like something a product engineer wrote by hand — no internal tooling names, no artifact filenames, no process-status vocabulary, no commit list, no diff stat.

Return the final body string to the caller.

## Important

- **Never fabricate test-plan steps or check off a template checkbox** without concrete evidence the item is satisfied.
- **Never include the commit list or a files-changed count** — GitHub's own tabs already show those.
- **Preserve the repo's own template structure** — override it only when strictly necessary.
- **Write for the human reviewer**, not for an audit trail — clarity and skimmability over completeness.
