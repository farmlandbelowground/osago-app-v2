# Code Comments

Comment discipline for every file you write — application code, server code, build scripts, config. Applies regardless of language or framework.

## The default is no comment

Start every file at **zero comments**. A comment is an exception you must justify, not a courtesy you add. Good names, small functions, and linear control flow are how code explains itself — reach for those first. If you are tempted to explain what a block *does*, the fix is almost always to make the block clearer, not to annotate it.

## What earns a comment

Only a **load-bearing *why* that a competent developer cannot recover from the code** — in 1–2 sentences. The *why* must be an external fact or constraint the code cannot state, not your reasoning about the design:

- A non-obvious external constraint that makes an otherwise-wrong-looking line correct (a platform quirk; an SDK write that resolves only on server-ACK and would hang offline; a listener that can fire synchronously, so a flag must be set before an `await`).
- A deliberate deviation whose *safety* depends on such a constraint (a DESC tiebreak that pairs with a specific composite index; an un-awaited fire-and-forget write that lands in the native cache).
- A genuine footgun the next editor would otherwise reintroduce.

If you cannot name the *why* in one plain sentence, it is not load-bearing — delete it.

**The boundary that matters most.** A comment that names an *external constraint* — why a line that looks wrong is actually safe — earns its place. A comment that narrates *your design decision and its payoff* does not, even when the decision is correct and involves a real race or trade-off. `// Counts are server-owned, so an immediate invalidate would race the trigger — patch optimistically instead` reads like a constraint, but it is the **rationale for a chosen cache strategy**: it goes in the PR description, not the code. Keep only the residue the code genuinely cannot carry (e.g. `// listener can fire synchronously — set the flag first`), never the strategy write-up.

## What does NOT earn a comment (delete these)

The recurring machine-generated patterns. None of them justify a comment:

- **Restating what the code does.** `// Read the latest store value imperatively` above `store.getState()`; `// Drop the deleted row from the cache` above a `.filter()`; `// the blocked list lives on the current user's profile` above `currentUser.profile.blockedUsers`; `// on success` / `// optimistic update` labelling a callback whose name already says it. The code already says it — including *where* a value lives, which is recoverable from the line that reads it.
- **Narrating your own reasoning to the reviewer.** `// Optimistic patch across all five cache surfaces so the heart flips instantly …` — that is rationale for *your decision*, not a constraint the code cannot express. It belongs in the PR description, not the file.
- **Cross-referencing other code or tasks.** `// mirrors cancelFollowRequest`, `// see the onboarding ticket`, `// step 3 inserts its section here`. The reader is in this file, not tracing your authorship trail.
- **Explaining the obvious.** `// to get the current profile`. And a per-field essay stapled to a plain interface: even *true* rationale (denormalization, server-owned counts) belongs in the PR description, not on the type — the disqualifier is the location and volume, not that a why exists.

Test: if a comment makes a competent developer think *"yes, I can see that from the code"* — it is noise. Delete it.

## Rationale goes in the PR description, never in the code

The urge is real: you made a non-trivial decision (a cache strategy, a denormalization, an invalidation choice) and want to record *why*. Record it — in the **PR description / commit message**, which is the channel built for design rationale. Code comments are not your decision log. This holds **even when the rationale names a real race or ordering hazard**: if the race is the *why behind your chosen strategy* rather than a constraint hidden from the reader of one specific line, it still belongs in the PR, not a comment block that ships to the customer forever.

## Invisibility — zero tolerance

**Code comments describe only the project's own code. They must never name your internal process** — no task IDs, no "per the ticket", no references to a plan, a step number, or another document. This is customer-facing source; process vocabulary leaking into it is a defect, not a style nit. A process reference is **deleted, not reworded** into project terms and kept.

```
❌ {/* Task 3 inserts its Requests section here, above the list */}
✅ delete it — there is nothing to annotate until the markup exists

❌ /* no-op — deferred per task spec */
✅ /* no-op */   (default) — or, only if genuinely non-obvious, a product-term why
                 that stands on its own merit (NOT the process reason reworded):
                 /* no-op — Settings has no unsaved state to flush */
```

## Volume is a signal

If most blocks in a file carry a comment, the comments are narration, not exceptions — and the file is wrong regardless of how short each one is. Length is the same signal in miniature: a single comment that runs past ~2 sentences — a step-by-step narration over one function or method — is over-commenting even if it is the only comment in the file. Justified comments are short *and* rare; a file with none is the normal, healthy case.
