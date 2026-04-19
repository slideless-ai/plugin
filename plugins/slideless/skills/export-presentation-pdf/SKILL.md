---
name: export-presentation-pdf
description: Convert a Slideless HTML presentation into a PDF. Bundled Puppeteer TypeScript runner auto-detects the style (`full-deck`, `slim-tabbed`) from the HTML and injects the right print CSS — one slide per page for full-deck. For `slim-tabbed` decks (tabbed panels behind JS clicks) the agent first rewrites the HTML so every tab becomes a standalone page, then calls the runner. Use after `generate-presentation` whenever the user asks for a PDF, a download, an attachment, or an offline copy.
---

# Export Presentation to PDF

Turns a `.html` file produced by `generate-presentation` (or any self-contained HTML) into a `.pdf`. The mechanical render is done by a bundled TypeScript CLI using Puppeteer (headless Chromium). For `slim-tabbed` decks the agent performs a small HTML transformation first, because tabbed panels don't paginate naturally — that's the "agent turning HTML into PDF" half of the workflow.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `html_path` | yes | Absolute path to the `.html` file to export. |
| `output_path` | optional | Absolute path to write the `.pdf`. Defaults to the sibling of `html_path` with `.pdf` extension. |
| `style` | optional | `full-deck`, `slim-tabbed`, `auto` (default), or `none` (raw print with no CSS injection). |
| `format` | optional | Paper format for the PDF. Defaults to `A4`. Common values: `A4`, `Letter`. |
| `orientation` | optional | `portrait` (default) or `landscape`. |

## Discovery Strategy

Assets ship inside this skill's folder. Find them like so:

1. Glob for `**/export-presentation-pdf/scripts/html-to-pdf.ts` to locate the skill root.
2. Layout:

```
export-presentation-pdf/
├── SKILL.md                ← this file
├── scripts/
│   ├── html-to-pdf.ts      ← Puppeteer runner (auto-detects style, auto-injects CSS)
│   └── package.json        ← pins puppeteer + tsx
└── print-css/
    ├── full-deck.css       ← print overrides for full-deck
    └── slim-tabbed.css     ← print overrides for slim-tabbed
```

If not found, tell the user: "I can't find the `export-presentation-pdf` skill assets. Make sure the `slideless` plugin is installed from the slideless marketplace."

## Prerequisites

- Node.js 20+ available on `PATH` (`node --version`).
- On first run the skill installs Puppeteer's bundled Chromium. ~1–2 minutes, ~300 MB of disk. Subsequent runs reuse the cached browser.

  ```bash
  cd <skill_root>/scripts
  npm install --no-audit --no-fund
  ```

  If `npm install` fails due to a proxy/firewall blocking the Chromium download, set `PUPPETEER_SKIP_DOWNLOAD=true` and point `PUPPETEER_EXECUTABLE_PATH` at a local Chrome/Chromium binary.

## Steps

1. **Resolve inputs.** Confirm `html_path` exists and is non-empty; default `output_path` if not given.

2. **Install deps (first time only).** If `<skill_root>/scripts/node_modules` is absent, run `npm install` in `<skill_root>/scripts`.

3. **Decide the path.**

   The runner auto-detects the style (by reading the HTML itself — no fragile shell grep) and auto-injects the matching print CSS. So **for `full-deck` decks, one call does the job**:

   ```bash
   cd <skill_root>/scripts
   npx tsx html-to-pdf.ts \
     --in  "$HTML_PATH" \
     --out "$OUTPUT_PATH" \
     --format "$FORMAT" \
     ${LANDSCAPE:+--landscape}
   ```

   The runner prints a JSON line to stdout including the detected style and the injected CSS path.

4. **For `slim-tabbed` decks**, the agent must restructure the HTML first because tabs live behind JS clicks and only one `.panel` has `display: flex` at a time.

   **a. Inspect the HTML.** Locate (class names may evolve, so read the actual file):
      - `.sidebar` / `.header` / `.footer` chrome
      - `.tab-btn[data-tab="N"]` navigation buttons
      - `.panel` (or `.tab-panel`) — one per tab
      - the `<script>` that toggles `.panel.active`

   **b. Write a transformed copy** to `<OUTPUT_PATH>.print.html` with these edits:
      - Strip the `.sidebar`, `.header`, `.footer` nodes (or collapse the whole `.app` grid to a flat document).
      - Remove or neutralize the tab-switching `<script>` (it's harmless but noisy).
      - The runner's `slim-tabbed` CSS already forces every `.panel` visible and page-breaks between them — you can leave the class names alone.

   **c. Render the intermediate:**

   ```bash
   cd <skill_root>/scripts
   npx tsx html-to-pdf.ts \
     --in  "$OUTPUT_PATH.print.html" \
     --out "$OUTPUT_PATH" \
     --style slim-tabbed \
     --format "$FORMAT" \
     ${LANDSCAPE:+--landscape}
   ```

   **d. Clean up** the intermediate `.print.html` unless the user asked to keep it.

5. **Read the runner's stdout.**
   Success: `{ "ok": true, "out": "...", "bytes": N, "style": "full-deck" | "slim-tabbed" | "unknown" | "custom", "injected": "..." | null, ... }`.
   Failure: non-zero exit + `{ "ok": false, "error": "...", "extra": "..." }` on stderr. Surface errors verbatim.

6. **Report to the user.** Include: absolute PDF path, size in KB/MB, detected style. Warn if the PDF is over 10 MB (suggest compressing inline images, dropping unused fonts).

## Overrides & Advanced Flags

| Flag | Meaning |
|---|---|
| `--style auto\|full-deck\|slim-tabbed\|none` | Force a style, or disable CSS injection (`none` = render HTML as-is). |
| `--inject <path>` | Inject a custom print CSS file instead of one of the bundled ones (overrides `--style`). |
| `--scale <0.1..2.0>` | Puppeteer PDF scale factor. |
| `--timeout-ms <ms>` | Navigation timeout. Default 60000. Raise for decks with heavy inline assets. |

## Pitfalls

- **Chromium not installed** → `npm install` in `scripts/` downloads it. If blocked, set `PUPPETEER_EXECUTABLE_PATH` to a local Chrome.
- **Google Fonts missed** → the runner uses `waitUntil: 'networkidle0'`; if the host is offline, fonts silently fall back. Warn the user if offline.
- **Animations frozen mid-state** → the print CSS forces `.anim`, `.reveal-word`, `.panel` to their end state. If a custom style uses different class names, add overrides or pass `--inject` with your own CSS.
- **Inline base64 images >1 MB** → the PDF will be large. The runner surfaces `bytes` so you can decide.
- **Truncated HTML** → Puppeteer will time out waiting for `networkidle0`. Error surfaces after ~60s; suggest re-running `generate-presentation`.
- **Unknown style** → the runner reports `"style": "unknown"` and renders without CSS injection. Output may paginate poorly. Pass `--style full-deck` if the layout is close, or `--inject` with a custom CSS.
- **Custom `@page` size in the injected CSS vs `--format`** → CSS wins (`preferCSSPageSize: true`). The bundled `full-deck.css` sets `@page { size: 1280px 720px }` (16:9), which is why the deck prints at slide aspect ratio regardless of `--format`. Remove the CSS `@page` rule if you want `--format` to take effect.

## Output Checklist

Before declaring done:

- [ ] Dependencies installed (first run only)
- [ ] Detected style surfaced to the user (or explained why `unknown`)
- [ ] PDF exists at `output_path` and is > 0 bytes
- [ ] Page count sanity-checked against expected slide/tab count
- [ ] For `slim-tabbed`: intermediate `.print.html` either deleted or explicitly kept at user request
- [ ] User sees the absolute path and file size in the chat, not buried in a code block
- [ ] On failure: the runner's stderr JSON is surfaced verbatim with the exit code

## When to Use the Share Skill Instead

If the user wants a link someone can click (not a file attachment), prefer `share-presentation`. PDFs are for: email attachments, printed handouts, offline reading, archival, or recipients who won't open a web link.
