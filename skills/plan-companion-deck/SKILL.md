---
name: plan-companion-deck
description: Package a long-running plan (a markdown spec produced from a Claude Code conversation) into a polished, shareable, multi-page slideless deck — an editorial article, the canonical plan rendered inline, a live execution roadmap that links to PRs and aggregates per-agent runtime + tokens, and optional companion articles for extension scopes (e.g. CLI surface, testing strategy). Bilingual EN/FR by default. Use when you have a plan worth showing off, want to track its implementation alongside the narrative, and want a single URL that updates as work ships.
---

# Plan Companion Deck

This skill builds a **multi-page slideless deck** that wraps a plan + execution log into a single shareable artifact. It is the methodology distilled from the Syndicable V1.1 build — generic enough to apply to any non-trivial plan that ships in phases driven by a Claude Code agent loop.

The pages are siblings sharing one stylesheet, one i18n script, and one localStorage key. Cross-page navigation preserves the slideless share token automatically (relative `./other.html` links stay inside the same iframe).

## When to use

Trigger this skill when the user has:

1. A **long-form plan markdown** (typically the output of a planning conversation with Claude Code). Tens of pages of structured prose.
2. A **conversation transcript** that produced the plan, full of decisions, trade-offs, and rationale.
3. A **named audience** they want to share the result with: a co-founder, a domain expert, a paying client, a hiring panel.
4. (Optional but typical) An **intent to ship in phases** with each phase visible to that audience as it happens.
5. (Optional, increasingly common) **Autonomous orchestration** — the user wants to run a chain of background subagents that implement the phases unattended, with the deck as the live ship-log.

Don't use this skill for one-shot pitch decks or talks (use `generate-presentation` with `full-deck` instead). This is for **content-heavy, multi-week, evolving** material where the deck stays useful long after the first share.

## What it produces

Three core pages (always) + optional companion pages (added on demand):

| Page | Role | When to add |
|---|---|---|
| `article.html` | Editorial article (10–15 sections + colophon). Hero, eyebrow-numbered sections, embedded figures, callouts, two-column scope, choice cards, tables, phasing strip, legal/constraints annex. | **Always** (entry page). |
| `plan.html` | The canonical plan markdown rendered with `marked.min.js`. Heading IDs prefixed `plan--<slug>` to avoid collisions. Sticky TOC built from h2s. | **Always**. |
| `roadmap.html` | Live execution log driven by `roadmap.json`. Phase cards + a top summary table aggregating runtime + tokens + PR links. | **Always**. |
| Companion article (e.g. `owner-view.html`, `cli.html`, `testing.html`, `<sub-version>.html`) | Same shape as `article.html`, scoped to a sub-plan that emerges mid-stream — a sub-version, a CLI surface plan, a test strategy. Each is its own tab. | **As needed** when scope expands beyond the initial plan. |

Folder layout (slideless folder mode):

```
my-plan-deck/
├── article.html               ← editorial write-up (entry)
├── plan.html                  ← canonical plan rendered inline
├── roadmap.html               ← live execution log
├── styles.css                 ← shared editorial styles
├── app.js                     ← shared i18n + cross-page nav
├── roadmap.json               ← machine-readable phase tracker
├── <plan-source>.md           ← snapshot of the canonical plan
├── marked.min.js              ← vendored markdown renderer
├── <diagram-N>.png ...        ← rendered diagram figures
├── <diagram-N>.mmd ...        ← mermaid sources alongside
├── <companion-1>.html ...     ← optional companion articles
└── slideless.json             ← created by `slideless push`
```

All pages share **one** styles.css, **one** app.js, **one** localStorage key for the EN/FR toggle. The cross-page mini-nav at the top of every page preserves the user's place when they jump between siblings.

## The autonomous orchestration loop

This is the working dynamic the skill is designed for. The user's role becomes mostly **strategic**; the orchestrator (Claude Code main session) drives the chain.

### Roles

- **User** — writes the plan, picks scope decisions, reviews PRs at their leisure. Authorizes the loop and walks away.
- **Orchestrator** (Claude Code main session) — writes per-phase briefs, launches subagents, auto-merges PRs, updates `roadmap.json`, re-pushes slideless. Stays in the loop end-to-end.
- **Phase subagents** (worktree-isolated background `Agent` runs) — implement one phase each. Build, test, commit, push branch, open PR (don't merge), report back.
- **Specialty subagents** (background `Agent` runs without worktree, since they touch docs not code) — author or update the deck pages (article, companion articles, roadmap.html, testing.html).
- **QA subagents** — exercise the deployed surface, fix bugs found, write missing tests, run full suite to green.

### The chain

For each implementation phase:

1. **Orchestrator writes a tight, self-contained brief** (the agent doesn't see the conversation). Brief includes: scope IN/OUT, files to touch + reference patterns, branch name, verification commands, "open PR but don't merge" instruction, report shape.
2. **Orchestrator spawns the agent** with `Agent(subagent_type='general-purpose', isolation='worktree', run_in_background=true, prompt=...)`.
3. **Agent works alone** in its worktree. Builds, tests, commits, pushes, opens PR, returns a report.
4. **Orchestrator receives the task-notification** with `<usage>` block (`duration_ms`, `total_tokens`). Captures these for the roadmap.
5. **Orchestrator auto-merges** the PR (`gh pr merge --merge --delete-branch`), syncs main locally.
6. **Orchestrator updates `roadmap.json`** — flips phase status to `shipped`, fills `branch`, `prUrl`, `prNumber`, `mergeCommit`, `commits[]`, `agent.{runtimeMs,totalTokens}`, `deviations[]`, `notesForLater`, `shippedAt`.
7. **Orchestrator re-pushes the deck** — `slideless push . --message "Phase X shipped" --entry article.html`.
8. **Orchestrator chains into the next phase** without further user input.

### Sequential vs parallel — and the worktree contamination trap

| Phases share repo? | Run them | Why |
|---|---|---|
| Same repo, hard dep (B reads A's schema) | **Sequential** | Worktree contamination: `isolation: 'worktree'` often collapses back to the main checkout. Two agents in one repo will overwrite each other's stash, branch state, and uncommitted files. We hit this with Phases D + E running in parallel — Phase D had to defensively commit several times to recover from Phase E's branch switches. |
| Same repo, no overlap (D = backend tally, E = frontend PV) | **Sequential** anyway | The contamination risk isn't worth the wall-clock saved. |
| Different repos (e.g. backend syndicable-app + CLI syndicable-cli) | **Parallel safe** | Different working directories, no contention. |

The realistic parallelism win: D ∥ E only after C lands, and only if you accept the contamination risk; or B-only-on-app ∥ X-only-on-cli — different repos, full parallel.

## Tracking time + tokens + PRs on the roadmap

Every implementation phase emits two metrics the orchestrator captures from the task-notification's `<usage>` block:

- `duration_ms` — wall-clock the agent ran
- `total_tokens` — cumulative token spend

Plus the implementation artifacts:

- Branch name (deleted post-merge, but the name is permanent log)
- PR URL + PR number
- Merge commit SHA
- Each commit (sha, message, githubUrl)

These all go into the phase's entry in `roadmap.json` under `agent` + `branch` + `prUrl` + `prNumber` + `mergeCommit` + `commits[]`.

`roadmap.html` renders this in two places:

1. **Phase cards** — per-phase block showing branch, PR (clickable `#N`), commit list (clickable SHAs), `Agent runtime: 36m 26s` + `Total tokens: 359,222`, deviations list, notes, shipped-at timestamp.
2. **Summary table at the top** — one row per shipped phase with agent metrics, `PR` column with the clickable `#N`, plus a TOTAL row aggregating runtime + tokens across the whole effort. Phases without metrics (planning subagents, manual polish, shared agent runs) show `—` and are excluded from the total.

This makes the roadmap a real ship log — at any moment, you can see "we burned 8h 19m of agent runtime and 3.2M tokens to ship phases A–E + V1.1.5 F–G + CLI-F + CLI-G + 4 QA rounds." Cost is visible, not hidden.

## Companion articles for emergent scope

Plans evolve. Mid-stream you'll discover scopes worth their own tab:

- A **sub-version** (e.g. V1.1.5 — owner-side view alongside the syndic-side V1.1)
- A **CLI surface** plan (when the project ships a CLI alongside the app, every CF needs a wrapper)
- A **testing strategy** (the contract for a QA subagent — Brugmann happy path + 22 negative scenarios + acceptance criteria)
- A **deployment runbook** (production rollout)

Each is a new sibling article with the same template:

- Pre-paint i18n IIFE keyed on the same `localStorage` key
- Shared `styles.css` + `app.js`
- Mini-nav with the new tab added (and added back to all siblings)
- 10–12 numbered sections + colophon
- Same FR-default + EN toggle

Add new tabs with a small batch update across all sibling pages — atomic Python or shell pass that injects the new `<a class="miniNav-tab">` line into each `<nav class="miniNav-tabs">`. Keep all pages consistent.

## Round 1 + Round 2 + Coverage — the QA loop

After the implementation phases land + deploy to staging, run a three-stage QA loop, each as its own subagent + roadmap entry:

| Phase | Agent does | Output |
|---|---|---|
| **TEST round 1** (e.g. `TEST-F` happy + `TEST-G` negative) | Run a Brugmann-style end-to-end happy-path script on the deployed CFs via the CLI. Then exercise §06 negative scenarios from `testing.html`. Diagnose 500s via `gcloud functions logs read`. Fix bugs as they surface, redeploy individual CFs, iterate. Open PR per repo. | Real bugs caught + fixed (in our run: secret bindings, missing Firestore indexes, mismatched error codes, archived-owner code). |
| **TEST round 2** (e.g. `TEST-H` deep) | Cover the negatives skipped in round 1, audit deferred items (PV PDF structural match, activity-log walkthrough), surface fresh edge cases (concurrency, regen, race, cancel-after-convocation). | Catches the bugs round 1 missed. In our run: 1 real bug (`issueProcurationToken` silent success when mandant is in person). |
| **TEST coverage** (e.g. `TEST-I`) | Analyze the Jest integration suite, identify CFs without negative tests, write missing tests, run the **full** suite to confirm 100% green, mark genuine emulator-only flakes as `it.skip` with documentation. | A regression net so the bugs caught manually never come back silently. |

Each appears as a phase on the roadmap with its own runtime + tokens + PR. The summary table totals everything — including QA — into the cumulative cost.

## Auto-merge — PR as log, not gate

The orchestrator **auto-merges every PR** as soon as the agent reports back. PRs are not review gates; they're permanent records of what shipped, when, with what diff.

Why:
- Phase agents test their own work (svelte-check, build, scoped jest). The agent passing its verification is the gate.
- Manual review breaks the autonomous chain.
- The PR diff is permanently inspectable on GitHub. Anyone can audit later.
- For real concerns, the user reads the agent's report (in the task notification) before the next phase fires. They can intervene with a TaskStop or a follow-up brief.

Caveats:
- **QA fix PRs** (the `fix(qa): ...` branches) are also auto-merged — they've been proven against staging.
- **Design-vs-spec contradictions** (cases where the agent finds behavior that doesn't match the spec but IS the right design) are NOT auto-fixed. The QA agent flags them in the report under `deviations` with a "DEFERRED — needs product decision" note. The user picks later. In our run: 4 such items (token-failure error code collapse, early-join semantics, heartbeat silent skip, etc.).

## Step-by-step procedure

### 1. Write `article.html` from the plan + conversation

Aim for **10–15 sections**: hero, thesis, scope, key choices, data model, auth, state machines, core mechanic, safety/correctness, pre-flight + post-flight, phasing, open questions, domain annex, colophon.

Constraints:
- Each section gets an `<section id="...">` with an eyebrow `NN · Title`.
- Embed mermaid diagrams as `.png` figures (render the `.mmd` to PNG separately — see §1b below).
- Mark every translatable string with `data-i18n-key="..."` and put both EN + FR strings into a `window.I18N = { en: {...}, fr: {...} }` block at the bottom.
- The hero pill stack carries the version + module + date.
- The article is the **front door**. Set `--entry article.html` on `slideless push`.

#### Prose width

Inside each section, narrative paragraphs go in `<div class="prose">` (max-width 68ch ≈ 50% of a desktop). Use `<div class="prose-wide">` (92ch) only for sections that have multi-column grids (`twocol`, choice cards) or wide tables. Don't put long paragraphs in `prose-wide` — they get hard to read past 75ch.

### 1b. Embedding diagrams — figures + lightbox

Mermaid diagrams render to `.png`, get wrapped in a `<figure class="figure">` block that **breaks out of the prose column** (wider than text), and become **click-to-enlarge** via a small lightbox. This pattern is what makes the deck feel polished. Skip any of it and you'll fight your own layout.

#### Canonical figure markup

Place the figure **outside** the surrounding `<div class="prose">` (close the prose div before the figure, reopen it after). The `.figure` class has negative-margin breakout that needs to operate at the section level, not nested inside `.prose`.

```html
<section id="schema">
  <div class="prose">
    <span class="eyebrow">03 · The new schema</span>
    <h2>Owner + Representative + a denormalized index.</h2>
    <p>Intro paragraph that introduces the figure below.</p>
  </div>

  <figure class="figure">
    <div class="figure-frame">
      <img src="data-model-v1-2.png" alt="Concise sentence describing the diagram for screen readers + lightbox aria-label." />
    </div>
    <figcaption class="figure-cap"><b>FIG&nbsp;1</b> · Caption explaining what the diagram shows. Often references field names.</figcaption>
  </figure>

  <div class="prose">
    <p>Continuation of the prose under the figure.</p>
  </div>
</section>
```

Why each element matters:
- `<figure class="figure">` — the wrapper that breaks out wide via negative margin (defined in `styles.css` under "Diagram breakouts").
- `<div class="figure-frame">` — the inner card with rounded corners, light background, soft shadow. The image lives inside this.
- `<figcaption class="figure-cap">` — italicised mono-prefix caption ("FIG 1 · …"). Renders centered below the frame.
- `alt` on the `<img>` — used as the lightbox `aria-label`. Be specific.

#### CSS overrides — image cap and lightbox

Add this block to the deck's local `styles.css` (template ships with it; if you forked from an older copy, append manually):

```css
/* ───────── Figure image cap + centering ─────────
 * Wide / nearly-square images render at full frame width. Truly tall
 * images (aspect ratio worse than ~1:2) get capped at 85vh and
 * letterboxed via object-fit:contain — without the cap, a tall mermaid
 * flowchart would render at 3000+ px tall. Click-to-zoom (lightbox JS)
 * gives full detail on demand.
 */
.figure-frame {
  display: flex;
  justify-content: center;
  align-items: center;
}
.figure-frame img {
  width: 100%;
  max-width: 100%;
  max-height: 85vh;
  height: auto;
  margin: 0 auto;
  object-fit: contain;
}

/* ───────── Lightbox (click any figure image to enlarge) ───────── */

.figure-frame img {
  cursor: zoom-in;
  transition: transform 0.15s ease;
}
.figure-frame img:hover {
  transform: scale(1.005);
}

.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(12, 18, 30, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  cursor: zoom-out;
  padding: 32px;
  overflow: auto;
  opacity: 0;
  transition: opacity 0.18s ease;
}
.lightbox-overlay.is-open { opacity: 1; }
.lightbox-overlay img {
  max-width: 100%;
  max-height: 95vh;
  width: auto;
  height: auto;
  border-radius: 6px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  cursor: zoom-out;
  background: var(--paper, #fff);
}
.lightbox-close {
  position: fixed; top: 18px; right: 22px;
  width: 36px; height: 36px;
  border-radius: 50%; border: none;
  background: rgba(255, 255, 255, 0.92);
  color: #0c121e; font-size: 22px; line-height: 1;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.lightbox-close:hover { background: #fff; }
.lightbox-caption {
  position: fixed; bottom: 22px; left: 50%;
  transform: translateX(-50%);
  max-width: 80ch; padding: 8px 16px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.94);
  color: #0c121e;
  font-size: 13px; line-height: 1.45;
  text-align: center; font-style: italic;
}
@media (max-width: 720px) {
  .lightbox-overlay { padding: 16px; }
  .lightbox-close { top: 8px; right: 8px; }
  .lightbox-caption { font-size: 12px; bottom: 8px; }
}
```

#### JS — auto-wire the lightbox

Append to the deck's local `app.js` (template ships with it). Self-contained IIFE; no dependencies. Binds once on DOMContentLoaded; idempotent (uses `data-lightbox-bound` flag) so it survives client-side re-renders.

```js
/* ───────── Lightbox — click any figure-frame image to enlarge ───────── */
(function () {
  if (typeof document === 'undefined') return;

  function buildOverlay(src, alt, captionHtml) {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', alt || 'Enlarged figure');

    const img = document.createElement('img');
    img.src = src; img.alt = alt || '';
    overlay.appendChild(img);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'lightbox-close';
    close.setAttribute('aria-label', 'Close enlarged figure');
    close.textContent = '×';
    overlay.appendChild(close);

    if (captionHtml) {
      const cap = document.createElement('div');
      cap.className = 'lightbox-caption';
      cap.innerHTML = captionHtml;
      overlay.appendChild(cap);
    }

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => overlay.classList.add('is-open'));

    function dismiss() {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      setTimeout(() => overlay.remove(), 200);
    }
    function onKey(e) { if (e.key === 'Escape') dismiss(); }
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target === close || e.target === img) dismiss();
    });
    document.addEventListener('keydown', onKey);
  }

  function wireImages() {
    document.querySelectorAll('.figure-frame img').forEach((img) => {
      if (img.dataset.lightboxBound) return;
      img.dataset.lightboxBound = '1';
      img.addEventListener('click', () => {
        const fig = img.closest('figure');
        const cap = fig ? fig.querySelector('.figure-cap') : null;
        buildOverlay(img.src, img.alt, cap ? cap.innerHTML : null);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireImages);
  } else {
    wireImages();
  }
})();
```

#### Mermaid aspect ratios — author for landscape

The single biggest layout footgun is a **tall portrait** mermaid diagram. Aspect ratio worse than 1:1.5 (height > 1.5× width) feels cramped inside the figure frame and triggers the 85vh cap (which letterboxes it narrow). Author for landscape: **width ≥ height**.

Patterns that go wide:
- `flowchart LR` (left-to-right) over `flowchart TB` whenever the data flow allows.
- Two `subgraph` blocks side-by-side for "before / after" comparisons (set the outer `flowchart LR` and put `direction LR` inside each subgraph).
- `sequenceDiagram` is naturally landscape — prefer it over `flowchart` for any "actor → CF → DB" pattern.
- `erDiagram` lays out roughly square if the entity count is balanced; for >8 entities, split into two figures (transactional core + audit/log periphery) rather than one tall mega-diagram.

Patterns that go tall (avoid unless necessary):
- `flowchart TB` with many sequential steps.
- `stateDiagram-v2` with many serial states. Prefer a few branches over one long line.
- A single `subgraph` that contains a long vertical chain — break it into two side-by-side subgraphs.

If a diagram MUST be tall (e.g., a state machine with 10 states), accept the 85vh cap with letterboxing and rely on the lightbox for full detail. Or split into two figures.

#### Render the .mmd to .png

```bash
npx -y @mermaid-js/mermaid-cli -i my-diagram.mmd -o my-diagram.png -b transparent -s 2
```

`-s 2` doubles the rasterization scale for retina-crispness. `-b transparent` lets the figure-frame's white card show through.

After rendering, sanity-check the dimensions:

```bash
file my-diagram.png | grep -oE '[0-9]+ x [0-9]+'
```

Aim for **W:H between 1:1 and 3:1** (landscape). If H > 1.5×W, the diagram is too tall — rework the mermaid source or split it.

### 2. Vendor `marked.min.js`

Download from `https://cdn.jsdelivr.net/npm/marked/marked.min.js` (or any pinned version). Drop it next to the HTML files.

### 3. Snapshot the plan markdown into the deck folder

Copy the canonical plan markdown into the deck folder as `<your-plan>.md`. Don't symlink. When the plan evolves, copy the new version in and re-push.

### 4. Build `plan.html`

Renders the markdown via `marked` with two custom renderer overrides:
- `renderer.heading` → emits `<hN id="plan--<slug>">` (prevents anchor collisions with article.html's `#scope`, `#auth`, etc.)
- `renderer.code` → preserves `data-lang="..."` so mermaid blocks get a label

Walks the rendered DOM, collects h2s, builds a sticky-side TOC. See `templates/plan.html`.

### 5. Build `roadmap.html` driven by `roadmap.json`

**`roadmap.json` schema** (the up-to-date one — extends the original with `version`, `repo`, `agent.sharedWith`):

```jsonc
{
  "presentation": { "id": "...", "title": { "en": "...", "fr": "..." } },
  "lastUpdatedAt": "2026-05-09T07:30:00Z",
  "phases": [
    {
      "phase": "A",
      "version": "v1.1",                 // optional — group phases by sub-version
      "repo": "syndicable-app",          // optional — for cross-repo work (CLI etc.)
      "title": { "en": "...", "fr": "..." },
      "scope": { "en": "...", "fr": "..." },
      "status": "shipped",               // shipped | in_progress | pending | blocked
      "branch": "feat/...",
      "branchDeleted": true,
      "prUrl": "https://github.com/.../pull/9",
      "prNumber": 9,
      "mergeCommit": "02f60a1",
      "commits": [
        { "sha": "a594896", "message": "...", "githubUrl": "..." }
      ],
      "agent": {
        "runtimeMs": 3037350,
        "totalTokens": 326248
        // Or: "sharedWith": "TEST-F" — when one agent run shipped two phases.
        //                              The shared phase is excluded from total aggregation.
      },
      "deviations": [ "..." ],
      "notesForLater": "...",
      "shippedAt": "2026-05-08T22:48:00Z"
    },
    { "phase": "B", "title": { ... }, "scope": { ... }, "status": "pending" }
  ]
}
```

Seed the JSON with **all phases** at once (lifted from the plan's phasing section, with `status: "pending"` for everything but the in-flight phase). The renderer hides `branch` / `prUrl` / `commits` / `agent` / `deviations` / `shippedAt` for `pending` phases.

**`roadmap.html`** has two main UI components:

1. **Top summary table** — one row per shipped phase with `Phase · Title · PR (clickable #N) · Runtime · Tokens` + a TOTAL row at the bottom. Phases without `agent` metrics or with `agent.sharedWith` show `—` and are excluded from the total.
2. **Phase cards** — full detail per phase: status pill, scope, branch, PR link, commits, agent metrics, deviations, notes, shipped-at timestamp.

Both render from the same `roadmap.json` fetch.

### 6. Add the cross-page mini-nav to every page

The `<header class="miniNav">` block goes immediately after `<body>` on every page. Tabs match the existing pages (3 minimum + companion articles as added). The lang toggle sits to the right of the tabs **on every page consistently** — same height + same border treatment as the tab group (matched via `.miniNav-tabs` styling).

Because tabs are plain `./other.html` relative links inside the same slideless deck folder, the share token in the parent `?token=...` URL is preserved automatically.

### 7. `slideless push`

From the deck folder root:

```sh
slideless push . --message "Initial multi-page deck" --entry article.html --json
```

First push creates the deck and writes `slideless.json`. Subsequent pushes update in place.

### 8. As phases ship, update `roadmap.json` and re-push

After each merge:

1. Update the phase entry from `pending` → `shipped` with all the implementation artifacts (branch, prUrl, commits[], agent metrics, deviations, shippedAt).
2. Bump `lastUpdatedAt`.
3. `slideless push . --message "Phase X shipped" --entry article.html --json`.

The roadmap fetches `roadmap.json` on load, so the change shows up immediately on the same hosted URL.

### 9. (When QA round runs) — three more roadmap entries

Add `TEST-F` (happy path), `TEST-G` (negative sweep — likely shares the agent with TEST-F via `sharedWith`), `TEST-H` (round 2 deep), `TEST-I` (Jest coverage). Same pattern: pending → shipped with all the metrics. The summary table aggregates everything.

## Templates

`templates/` ships with starter files wired with mini-nav + i18n scaffolding. Copy them into your deck folder, then fill in content:

- `templates/article.html` — empty 13-section editorial scaffold with mini-nav + side nav + lang toggle + I18N skeleton. Replace section bodies and add figures.
- `templates/plan.html` — works out of the box; just rename the `.md` file it fetches (one line near the bottom).
- `templates/roadmap.html` — works out of the box. Includes the summary table at the top.
- `templates/styles.css` — shared styles. Copy verbatim; tweak the `:root` palette for brand fit. The `.lang-switch` matches `.miniNav-tabs` shape (outer border, inner pills with no border, same height).
- `templates/app.js` — shared i18n + active-section helper. Copy verbatim.
- `templates/roadmap.json` — sample with one shipped phase + four pending placeholders + a `TEST-?` example illustrating the `sharedWith` field.

## Generic, not domain-specific

The starter HTML is **deliberately generic**. The Syndicable example happens to be Belgian copropriété law (assemblée générale, quotités, procès-verbal), but the methodology is just: editorial article → canonical plan → live roadmap → optional companions → QA log. Adapt section titles to your domain. The Belgian-law table component (`legal annex` row pattern in styles.css under `.tablewrap`) reuses the same primitives — works equally well for "compliance constraints", "API contracts", "security requirements", or any domain where you want a constraint-where-it-surfaces table.

## References

- **Frozen example shipped with this skill**: `example/` (sibling of this `SKILL.md`).
  - 6 tabs: Article · Plan · Roadmap · Owner-view (V1.1.5) · CLI · Testing
  - 13 phase cards on the roadmap (5 V1.1 + 2 V1.1.5 + 2 CLI + 4 QA), all `shipped`, with real commits + PRs + agent metrics
  - Aggregated cost in the summary table: ~8 h 19 m runtime, ~3.2 M tokens
  - Open `example/article.html` in a browser to walk it. See `example/README.md` for a quick tour.
- **Live origin (internal, token-protected)**: `https://app.slideless.ai/share/019e08ea-0c31-77b9-bbf4-440bbfa324a9?token=<...>`
- **Sibling skills**:
  - `generate-presentation` — single-deck pitch + workshop styles. Use that one if you don't need the plan + roadmap split.
  - `push-presentation` — the underlying `slideless push` wrapper.
  - `share-presentation` — to mint the public viewer URL.

## Don'ts

- Don't reference `slideless` from inside the deck content itself — slideless is the host, not the subject. The reader shouldn't notice it.
- Don't ingest agent transcripts (`.jsonl` files) into the deck — they typically contain private context (file reads, internal reasoning, raw tool output). Build the article from the plan + your own editorial pass.
- Don't push to git from the deck folder. The deck is published by `slideless push`, not by GitHub.
- Don't fork the I18N + lang toggle code per page. One `app.js`, one localStorage key, one `window.I18N` per page.
- Don't fabricate phase data on `roadmap.json` — leave `pending` placeholders for unshipped phases until they actually merge. The roadmap is a **log**, not a forecast.
- Don't try to run two same-repo phase agents in parallel via `isolation: 'worktree'`. The "isolation" often collapses to the main checkout and the agents step on each other (we lost ~75 minutes of Phase E runtime to this — agent had to defensively commit four times to recover). Sequential within a repo, parallel across repos.
- Don't forget to capture `duration_ms` + `total_tokens` from the task notification's `<usage>` block on every phase. They're the cost story; the user wants to see them.
- Don't auto-merge "design-vs-spec contradiction" fixes. When QA finds behavior that doesn't match the spec but IS the right design, flag it under `deviations` with `DEFERRED — needs product decision` and stop. The product call belongs to the user.
