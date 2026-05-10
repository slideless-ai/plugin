# Example — Syndicable V1.1 deck

This folder is a **frozen snapshot** of the actual deck that produced the methodology this skill captures. Real plan, real article, real implementation phases, real PRs, real bug fixes.

## What you're looking at

The deck for **Syndicable V1.1** — a Belgian copropriété (mede-eigendom) management app's Assemblée Générale module. The plan ran 13 phases end-to-end across two repos via an autonomous Claude Code agent chain. Total agent runtime: ~8 h 19 m, ~3.26 M tokens. Visible in the roadmap summary table.

The hosted version (token-protected, internal):
`https://app.slideless.ai/share/019e08ea-0c31-77b9-bbf4-440bbfa324a9?token=<...>`

## Files

Six HTML pages — all sharing `styles.css` + `app.js` + the mini-nav scaffolding:

| File | What it is |
|---|---|
| `article.html` | Editorial write-up of the V1.1 plan. The front door (entry page). |
| `plan.html` | Canonical plan markdown rendered inline via `marked.min.js`. |
| `roadmap.html` | Live ship log driven by `roadmap.json`. Top summary table aggregates per-phase runtime + tokens + PR; phase cards show the full detail. |
| `owner-view.html` | A **companion article** for V1.1.5 — the owner-side view scope that emerged mid-stream. Same template, new tab. |
| `cli.html` | Companion article for the CLI surface plan — every Cloud Function mapped to a `syndicable` CLI wrapper. |
| `testing.html` | Companion article for the QA strategy — Brugmann happy path + 22 negative scenarios. |

Plus the supporting assets:

- `roadmap.json` — populated with all 13 shipped phases (5 implementation + 2 sub-version + 2 CLI + 4 QA). Demonstrates the full schema: `version`, `repo`, `agent.{runtimeMs,totalTokens}`, `agent.sharedWith`, `commits[]`, `deviations[]`, `notesForLater`, `prUrl`, etc.
- `quiet-painting-papert-v1-1.md` — the canonical V1.1 plan markdown that `plan.html` renders.
- 9 × `*.mmd` + matching `*.png` — mermaid diagram sources alongside the rendered figures (data model, auth flow, lifecycle state machines, sequence diagrams).
- `styles.css`, `app.js`, `marked.min.js` — same shared assets a fresh deck would use.

## How to read it

1. Open `article.html` in a browser. It's the entry point. Read the editorial.
2. Click the **Roadmap** tab. Look at the summary table at the top — that's the runtime/tokens/PR aggregation pattern in action. Click `#9` to jump to the actual GitHub PR for Phase A.
3. Click the **Plan** tab. Same content as `quiet-painting-papert-v1-1.md`, just rendered with anchor-prefixed headings (so the section IDs don't clash with `article.html`'s).
4. Read `roadmap.json` directly to see how each phase entry is structured. Especially:
   - **Phase A** — the canonical "fully populated shipped phase" example (commits, agent metrics, deviations).
   - **TEST-G** — the canonical `agent.sharedWith` example (round 1 testing-execution agent shipped TEST-F + TEST-G in one run; metrics live on TEST-F, TEST-G points back).
   - The mix of `version: "v1.1"`, `version: "v1.1.5"`, `version: "v1.1+cli"`, `version: "v1.1+qa"`, `version: "v1.1+qa-round-2"` — illustrates how to scope sub-versions and QA rounds within one roadmap.

## What's NOT in here

- `slideless.json` — bound to a specific presentation ID; deliberately omitted so a copy of this folder doesn't try to update someone else's deck.
- The Claude Code agent transcripts (`.jsonl`). Per the methodology, those stay private — file reads, internal reasoning, raw tool output. Build the article + roadmap from the plan + agent reports, never the transcripts.

## How this example was produced

The full chain is documented in the parent `SKILL.md` (sibling of this folder). Short version:

1. The user wrote `quiet-painting-papert-v1-1.md`.
2. A planning subagent generated the editorial article + diagrams.
3. The user authorized an autonomous chain.
4. The orchestrator (Claude Code main session) launched a background `Agent` per implementation phase, auto-merged each PR, updated `roadmap.json`, re-pushed slideless. 13 cycles total.
5. Two QA agents (deep + coverage) iterated on the deployed surface until every guard had a typed error and every fix had a regression test.

Read `SKILL.md` for the full methodology, including the worktree-contamination trap, sequential vs parallel rules, and the design-vs-spec deferral pattern.
