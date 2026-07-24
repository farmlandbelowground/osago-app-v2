---
name: analyze-figma
description: Extract a Figma frame via MCP and produce an exhaustive raw-data design-export document — every color (hex), font (family/weight/size/lineHeight/letterSpacing), spacing number, radius, shadow, layout tree, and interactive element observed in the design. The output is purely descriptive of what Figma says; it makes no project-specific decisions about theme-token mapping, component reuse, decomposition, or icon staging — those are the implementer's job at build time. Output vocabulary uses DOM element semantics (div / section / nav / header / footer / article / main / aside / button / form / label / input).
---

# Analyze Figma Skill

Produces a **design-export document** — an exhaustive Figma inspector-style dump written to a markdown file. The document is the authoritative source of design data for whoever implements the screen next; it performs no project-specific decisions itself (theme mapping, component reuse vs. create, decomposition, icon export) — those are the implementer's calls, made against this document plus the project's rules and patterns.

The analyst describes; the implementer decides.

## When to Use

When the user gives a Figma URL and wants it turned into a structured, implementable spec — "implement this screen", "here's the Figma for the settings page", "extract this design".

## Inputs

- **Figma URL or frame reference** (required) — a `figma.com/design/...?node-id=...` URL or an explicit `fileKey + nodeId` pair
- **Output path** (optional) — where to write the design-export file. Default: `docs/design-exports/<slug>.md`, where `<slug>` is a kebab-case name derived from the Figma frame's name.

## Prerequisites

### Figma MCP

The Figma MCP server must be installed and authenticated before this skill runs — that is a one-time environment setup on the developer's own machine, not something this skill can do.

If the Figma MCP tools (`get_design_context`, `get_screenshot`, `get_variable_defs`, or a community server's equivalents like `get_figma_data` / `download_figma_images`) are not reachable when this skill runs, **stop immediately** and report:

> "Figma MCP is not available. Install and authenticate the Figma MCP server before Figma-driven work can be processed."

Do not fabricate design data. Do not attempt workarounds. Do not try to parse Figma URLs without MCP.

Common MCP-availability failure modes to recognize and report accurately:

- MCP server not registered → no tools starting with `get_design_context`
- Auth expired → tool calls return authentication errors
- File not shared with the authenticated account → `get_design_context` returns "not found" for nodes that visibly exist
- Rate limited → tool calls return retry-after headers or similar

### Stay project-blind during extraction

While extracting, do **not** read the project's theme tokens (the CSS custom properties in `globals.css`), `src/shared/components/`, `src/shared/assets/icons/`, `src/env.ts`, or any other project source. Loading project-side files during extraction pulls this step into making project-specific decisions (mapping to existing tokens, recommending component reuse) that belong to implementation time, once this document exists as a neutral reference. The only project-side thing to check is that the output directory exists.

## Workflow

### Step 1 — Parse the Figma URL

Extract `fileKey` and `nodeId`:

- Canonical form: `figma.com/design/:fileKey/:fileName?node-id=:nodeId`
- Branch form: `figma.com/design/:fileKey/branch/:branchKey/:fileName?node-id=:nodeId` — use `branchKey` as `fileKey`
- Convert `nodeId` from URL format (dashes) to MCP format (colons): `42-1337` → `42:1337`

### Step 2 — Retrieve Design Data (parallel MCP calls)

Issue the Figma MCP calls in parallel:

1. `get_design_context` with `fileKey` + `nodeId` — returns the full structural tree of the frame (every node with its properties, geometry, fills, strokes, effects, text styles)
2. `get_screenshot` with `fileKey` + `nodeId` — returns a visual reference (used to cross-check the extracted tree against what the design actually looks like)
3. `get_variable_defs` with `fileKey` — returns the file's design-token definitions if it uses Figma Variables / Styles (color tokens, number tokens, etc.)

Wait for all calls before proceeding. If `get_variable_defs` returns nothing (file does not use Figma Variables), continue without it — Variables are nice-to-have, not required.

### Step 3 — Inventory the Frame

Describe nodes using DOM element semantics: `div`, `section`, `nav`, `header`, `footer`, `article`, `main`, `aside`, `button`, `form`, `label`, `input`, etc. Layout language uses CSS box-model terms (padding, margin, gap, flex-direction, justify-content, align-items).

Walk the structural tree from `get_design_context` and build, in memory:

1. **Layout tree** — every node from root to leaf, preserving hierarchy. For each node: `id`, `name`, `type` (`FRAME`, `INSTANCE`, `TEXT`, `VECTOR`, etc.), bounding box, layout properties (auto-layout direction, gap, padding, alignment), fills, strokes, effects (shadows / blurs), corner radius, opacity, visibility.
2. **Text-leaf catalog** — every `TEXT` node with its full style (font family, weight as numeric, size in px, line height in px or as multiplier, letter spacing in px or % as Figma reports it, text color hex, alignment, decoration, transform).
3. **Color catalog** — every fill, stroke, gradient stop, shadow color encountered, recorded as raw hex (or hex+alpha if not opaque). Where the same hex appears in multiple places, record all usage sites — do not deduplicate.
4. **Spacing catalog** — every gap, padding, margin, distance value encountered.
5. **Border-radius catalog** — every corner-radius value encountered (per-corner if asymmetric).
6. **Shadow / effect catalog** — every drop shadow, inner shadow, blur with full parameters (`x`, `y`, `blur`, `spread`, `color hex+alpha`).
7. **Icon-node catalog** — every `VECTOR`, `BOOLEAN_OPERATION`, or `INSTANCE` of an icon component. For each: `id`, name as Figma stores it, bounding box (width × height), color (fill / stroke), brief shape description ("upward-pointing chevron", "magnifying glass with handle", "filled circle with offset overlay"). **No SVG export, no staging, no project-side filename suggestion at this step.**
8. **State variants** — if the design contains multiple frames representing different component states (default / hover / pressed / disabled / loading / empty / error), record which states are present and how they differ structurally and stylistically.
9. **Interactive elements** — any node marked with a Figma interaction (click, hover) or carrying a label that suggests interactivity ("Submit", "Back", an icon button). Record the trigger and the visible behavior or state change observed in the design.

Off-scale values, asymmetric paddings, and other anomalies that look like they might be inconsistencies in the design are **flagged** — never silently rationalized. Whoever implements the screen (with the human reviewer) decides whether they are intentional.

### Step 4 — Completeness Check

Before writing anything to disk, verify the in-memory inventory built in Step 3 is complete. The most common failure mode of a Figma-extraction step is an incomplete dump that forces whoever implements the screen to silently re-fetch Figma or invent missing data. The check below is a mechanical defence against that failure.

For each pair below, the count on the right MUST equal or exceed the count on the left. Extras are normal (the same color used twice produces two rows; one node with multiple fills produces multiple color rows) — what matters is that nothing is missing.

| MCP-side count | Inventory-side count |
|----------------|---------------------|
| `TEXT` nodes returned by `get_design_context` | rows in the Typography catalog |
| `VECTOR`, `BOOLEAN_OPERATION`, and icon-`INSTANCE` nodes | rows in the Icons table |
| Distinct fill / stroke / gradient-stop colors across all nodes | rows in the Color catalog (counted as **distinct hex values × distinct usage sites**, not deduplicated) |
| Distinct corner-radius values across all nodes | rows in the Border-Radius catalog |
| Drop-shadow / inner-shadow / blur effects | rows in the Shadow & Effect catalog |
| Every visible node in the layout tree | per-element spec entries in Per-Element Specifications |
| Auto-layout containers with non-zero gap or padding | corresponding rows in the Spacing catalog |

Also verify, by attribute spot-check rather than count:

- Every `TEXT` row has all six font attributes (family, weight, size, line height, letter spacing, color); a row missing any of them is incomplete and must be patched from the MCP data, or marked `MCP: not returned` if Figma genuinely did not return it
- Every icon row has Figma node id, dimensions, color, and shape description; a row with `name only` is incomplete
- Every per-element spec block has bounding box, fills, layout (or "n/a" if not auto-layout), and child references where applicable

If any pair fails or any spot-check reveals a missing attribute:

1. **Stop** — do not write a partial design-export
2. Return to Step 3 and walk the missing nodes again, including their `get_design_context` payloads in detail
3. If MCP genuinely did not return a property for a specific node, record `MCP: not returned` in that field. This is the only acceptable form of "incompleteness" — known unknowns, surfaced explicitly

If after one re-walk the counts still do not match and you cannot identify why, **stop and surface the gap to the user** rather than writing. State exactly which nodes / properties are missing.

If all pairs pass, proceed to Step 5.

### Step 5 — Compose and Write the Design Export

Write the design-export document to the resolved output path. Fill every section with concrete data — prose alone is not enough. Where Figma did not return a property, write `MCP: not returned` rather than guessing.

The document has the following structure.

````markdown
# <Screen Name> — Design Export

This document is a **raw inspector-style dump** of the Figma frame. It is the authoritative source of design data for implementation — theme-token mapping, component reuse vs. create, decomposition, and icon export are decided at implementation time, not here.

## Source

- **Figma URL:** <full URL>
- **File / node:** `<fileKey>/<nodeId>`
- **Frame name:** <as shown in Figma>
- **Frame dimensions:** <W>×<H> px @ 1x
- **Extracted on:** <ISO-8601>
- **MCP tools used:** `get_design_context`, `get_screenshot`, `get_variable_defs`

## Variables Detected

If `get_variable_defs` returned definitions, list them as raw facts about the file. Do **not** map them to anything project-side.

### Color variables

| Variable name | Value (hex / hex+alpha) |
|---------------|-------------------------|
| `Color/Primary/500` | `#FF6B35` |

### Number variables

| Variable name | Value |
|---------------|-------|
| `Spacing/sm` | `8` |

### Text-style variables

| Variable name | Family | Size | Weight | Line height | Letter spacing |
|---------------|--------|------|--------|-------------|----------------|
| `Body/16/SemiBold` | Poppins | 16 | 600 | 24 | 0 |

If the file does not use Variables, write: `Figma file does not use Variables / Styles — all values are raw hex / numeric throughout this document.` and skip the sub-tables.

## Layout Tree

Hierarchical representation of every container and leaf in the frame. Each line names the node, its type, and the most important raw style fragment.

```
<Screen Root>  [FRAME, root]
│  size: 375 × 812
│  background fill: #FAFAFA
│  layout: vertical, gap: 0, padding: 0
│
├── <TopBar>  [FRAME, AutoLayout]
│   │  layout: horizontal, gap: 8, padding: 8 16 12 16 (top right bottom left)
│   │  background: #FAFAFA
│   │  size: 375 × 52
│   │
│   ├── <BackButton>  [INSTANCE: IconButton]
│   │    size: 32 × 32
│   │    fill: #F4F5F6
│   │    radius: 100
│   │    icon child: <CaretLeft> (vector, 16 × 16, #212629)
│   │
│   └── <TopBarTitle>  [TEXT]
│        text: "Upcoming Events"
│        font: Poppins / 600 / 16 / 24 / 0
│        color: #212629
│        layout: flex 1, textAlign: left
│
└── <EventList>  [FRAME, AutoLayout]
    ... etc ...
```

The tree continues until every visible node is captured.

## Per-Element Specifications

For each named element in the layout tree above, give a complete spec — bounding box, fills, layout (flex-direction, gap, padding, justify-content, align-items), stroke, effects, and children. This is the section whoever implements the screen reads to know what each element should look like.

### `<Screen Root>`

- **Node type:** `FRAME`
- **Bounding box:** 0, 0, 375, 812
- **Background fill:** solid `#FAFAFA`
- **Layout:** `flex-direction: column; gap: 0; padding: 0;`
- **Stroke:** none
- **Effects:** none
- **Children:** `<TopBar>`, `<EventList>`

<Continue for every named element in the layout tree.>

## Color Catalog

Every color observed in the frame, recorded raw. Same color appearing in multiple places → multiple usage rows. No deduplication, no project-side mapping.

| # | Hex | Element | Property |
|---|-----|---------|----------|
| 1 | `#FAFAFA` | `<Screen Root>` | background fill |

## Typography Catalog

Every text style observed. One row per text leaf.

| # | Element | Family | Weight | Size (px) | Line height (px) | Letter spacing | Color (hex) |
|---|---------|--------|--------|-----------|------------------|----------------|-------------|
| 1 | `<TopBarTitle>` | Poppins | 600 | 16 | 24 | 0 | `#212629` |

## Spacing Catalog

| # | Value (px) | Element | Property |
|---|-----------|---------|----------|
| 1 | 8 | `<TopBar>` | layout gap |

## Border-Radius Catalog

| # | Value (px) | Element |
|---|-----------|---------|
| 1 | 100 | `<BackButton>` |

If a node has asymmetric corner radii, record each corner separately (`top-left`, `top-right`, `bottom-right`, `bottom-left`).

## Shadow & Effect Catalog

| # | Type | x | y | blur | spread | color | Element |
|---|------|---|---|------|--------|-------|---------|
| 1 | drop-shadow | 0 | 4 | 12 | 0 | `#0000001F` (alpha 12%) | `<EventCard>` |

If the frame uses no effects, write: `No drop shadows, inner shadows, or blur effects observed.`

## Icons

Every icon node observed in the frame — raw fact only (Figma node id, dimensions, color, shape description). **No SVG export, no project-side filename, no recommendation** — implementation decides which icons to reuse from the project's existing set and which to export from Figma, per [Assets and Icons](../../../patterns/assets-and-icons.md).

| Figma node id | Name in Figma | Size (px) | Color | Shape description | Where used |
|---------------|---------------|-----------|-------|-------------------|------------|
| `103:59875` | `CaretLeft` | 16 × 16 | `#212629` | Left-pointing chevron, 1.5 px stroke, no fill | Inside `<BackButton>` |

## Interactive Elements

Behavioral elements as raw design facts — implementation decides handlers / navigation / state; this only records what the design says happens.

| Element | Trigger observed in Figma | Behavior or state change observed |
|---------|---------------------------|-----------------------------------|
| `<BackButton>` | tap (Figma "On click" interaction, or implicit from a back-arrow icon) | navigates to previous screen |

## States Present in the Design

If the Figma file contains separate frames representing different states of the same screen / component (default / hover / pressed / disabled / loading / empty / error / success / variant), enumerate them and describe how each differs from the default.

| State | Frame node id | Differences from default |
|-------|---------------|--------------------------|
| `loading` | `406:12001` | `<EventList>` replaced by centered spinner |

If only the default state is present, write: `Only the default state is present in the design.`

## Anomalies and Off-Scale Values

Anything that looks inconsistent — not silently rationalized.

- `<EventCard>` schedule tag uses `paddingTop: 3` and `paddingBottom: 4` — a 1 px asymmetry. Likely a Figma-only artifact, but worth confirming with the designer.

If the frame is fully consistent, write: `No anomalies or off-scale values observed.`

## Open Questions

Anything the extraction could not resolve from the Figma data alone.

- The CTA label `"{ctaLabel}"` appears as a placeholder string — confirm the source (i18n key, prop, hardcoded copy).

If there are no open questions, write: `No open questions.`

## Extraction Notes

- `get_design_context` returned the full tree with no errors.
- `get_screenshot` returned a <W> × <H> PNG — visual cross-check passed: every named node in the layout tree corresponds to a visible region in the screenshot.
- `get_variable_defs` returned <N> color variables, <M> number variables, <K> text-style variables.
- The following properties were requested but not returned by MCP for some nodes — recorded as `MCP: not returned` in the per-element specs: `<list>`.
````

**Length and tone:** verbose is correct. The design-export is not meant to be short — it is meant to be complete. A moderately complex screen will produce a 600 – 1500 line design-export. That is working as designed.

## Output

The skill returns one thing: the **path to the written design-export file**. No summary of decisions, no list of "new tokens needed", no reuse percentages. The file is the artifact; implementation reads it and makes all project-specific decisions.

If anomalies or open questions were flagged, those live inside the design-export's own `Anomalies` / `Open Questions` sections — they are not duplicated into a return summary.

## Important

- **Describe, don't decide.** Every line in the design-export is a fact about Figma. No project-side mapping. No "this maps to `theme.colors.primary`". No "this should reuse `Button`". No "extract this as a sub-component". All of that belongs to implementation time.
- **The design-export is exhaustive, not aspirational.** Every Figma element gets a line in the layout tree and a per-element spec block. Every color gets a row in the catalog. Every spacing gets a row. Vague phrasing ("some spacing", "appropriate padding") is forbidden — use exact numbers.
- **No SVG export, no icon staging, no `.icons/` folder.** Icons are described in raw form (node id, size, color, shape description) in the Icons section. Implementation decides which icons to reuse and which to export, per [Assets and Icons](../../../patterns/assets-and-icons.md).
- **Off-scale values get flagged, not approximated.** A `17 px` next to a `16 px` is recorded honestly in the Anomalies section.
- **Never fabricate.** If MCP does not return a property, write `MCP: not returned` rather than guessing. If a node looks ambiguous in the screenshot but the structural data is missing, surface it in Open Questions.
