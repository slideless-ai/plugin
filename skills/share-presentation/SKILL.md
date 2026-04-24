---
name: share-presentation
description: Upload a presentation (single HTML or a folder with assets) to slideless and return a public share URL anyone can open in a browser. Use this after `generate-presentation` when the user asks to share, send, or publish their deck. Also supports updating an existing share in place (same URL, new content).
---

# Share Presentation

Wraps `slideless share` (and `slideless share --update <shareId>` when re-publishing). Uploads a deck to the slideless backend and returns a public share URL with an unguessable token. Anyone with the URL views the presentation in their browser; no login required.

Slideless v3 accepts a folder containing `index.html` plus any images, videos, 3D assets, shaders, CSS, or JS files — relative paths inside the HTML (`./hero.jpg`, `../styles.css`) resolve naturally, same as serving the folder from a local static webserver. A single `.html` file still works as a one-file deck.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `source_path` | yes | Path to either a folder containing the deck (with entry HTML) or a single `.html` file. |
| `title` | yes | Display title for the presentation (shown in the user's slideless dashboard). Ask the user if not implied by the files. |
| `entry` | optional | Entry HTML file name inside the folder. Default `index.html`. Ignored when `source_path` is a `.html` file. |
| `share_id` | optional | If provided, **updates** the existing presentation at that shareId. URL stays the same, view count preserved, version bumped. Unchanged assets are deduplicated — only new or modified files upload. |
| `strict` | optional | If true, upload fails on any unresolved relative reference found by the pre-upload static scan (missing file, typo in path). Default: warnings only. |

## Prerequisites

- `slideless` CLI installed and authenticated — if `slideless --version` fails with `command not found`, invoke the `setup-slideless` skill first, then retry.
- Confirm with `slideless whoami` that the active profile has `presentations:write` scope.
- CLI version ≥ 0.3.0 (needed for folder mode). If older, re-run `setup-slideless` to refresh.

## Folder layout

Any folder layout works — Slideless imposes no `/assets/` convention. Typical patterns:

```
deck/                     deck/                     deck/
├── index.html            ├── index.html            ├── index.html
└── hero.jpg              ├── images/               ├── styles.css
                          │   └── hero.jpg          ├── hero.jpg
                          ├── video/                ├── demo.mp4
                          │   └── demo.mp4          └── three/
                          └── three/                    ├── scene.js
                              ├── scene.js              └── model.glb
                              └── model.glb
```

The folder is uploaded verbatim, except:
- Built-in ignores: `.git/`, `node_modules/`, `.DS_Store`, `Thumbs.db`, `.vercel/`, `.next/`, `*.log`.
- User can add a `.slidelessignore` file (gitignore syntax) to exclude more.

External CDN references (`https://unpkg.com/...`, `https://fonts.googleapis.com/...`) remain valid — the viewer's browser fetches them at render time.

## Steps

1. **Validate the input** — confirm the folder or file exists. If `source_path` is a folder, confirm it contains the entry HTML (`index.html` by default; override with `entry`).

2. **Run the CLI** — pass `--json` so the response shape is stable.

   Create a new share:
   ```bash
   slideless share "$SOURCE_PATH" --title "$TITLE" --json
   ```

   Custom entry file:
   ```bash
   slideless share "$SOURCE_PATH" --title "$TITLE" --entry "$ENTRY" --json
   ```

   Update an existing share (unchanged assets will be deduplicated):
   ```bash
   slideless share "$SOURCE_PATH" --title "$TITLE" --update "$SHARE_ID" --json
   # equivalent to: slideless update "$SHARE_ID" "$SOURCE_PATH" --title "$TITLE" --json
   ```

   Strict mode — fail on unresolved references:
   ```bash
   slideless share "$SOURCE_PATH" --title "$TITLE" --strict --json
   ```

3. **Parse the JSON** and surface the URL.

   Create response:
   ```json
   {
     "success": true,
     "data": {
       "shareId": "01a3b...",
       "tokenId": "01a3c...",
       "token": "...",
       "version": 1,
       "shareUrl": "https://app.slideless.ai/share/...?token=...",
       "assetsUploaded": 5,
       "assetsDeduped": 0,
       "totalBytes": 12345678
     }
   }
   ```

   Update response: same shape, `tokenId`/`token` omitted, `assetsDeduped` will typically be > 0 on re-uploads.

   Error response (any failure):
   ```json
   {
     "success": false,
     "status": 413,
     "error": { "code": "payload-too-large", "message": "..." }
   }
   ```

4. **Present the URL to the user.**

   For create:
   > Your presentation is live: **&lt;shareUrl&gt;**
   > Anyone with this link can open it in their browser. Assets load natively — images, video, 3D all work. Manage from `https://app.slideless.ai`.
   > **Tip:** save `shareId: <id>` to update this deck later — `slideless update <shareId> <path>` keeps the same URL.

   For update:
   > Updated to version &lt;version&gt;. Same URL, viewers see the new content on next load. `assetsDeduped: <N>` means N assets were already present and weren't re-uploaded.

## Pitfalls

- **No CLI installed** → "command not found". Run `setup-slideless` first.
- **Wrong CLI version** → older CLIs (≤0.2.x) reject folders. Run `setup-slideless` to upgrade.
- **Not logged in** → CLI returns `unauthenticated`. Run `slideless login`.
- **Wrong scope** → 403 / `permission-denied`. The active profile lacks `presentations:write`. Re-run `setup-slideless` to mint a new key.
- **Parent-directory references** (`<img src="../assets/foo.jpg">`) are a hard error — the deck must be self-contained within the folder. Move the asset into the folder or use a CDN URL.
- **Total deck size caps** depend on the plan. Free tier: 50 MB per file, 250 MB total. If upload returns `payload-too-large`, compress videos or drop unused files.
- **Dynamic JS-built URLs** can't be caught by the static scan — test the uploaded URL in a browser to confirm every asset loads.
- **Archived presentations are terminal.** Cannot update or un-archive a presentation that's been archived.

## Output checklist

- [ ] Folder/file exists and contains the entry HTML
- [ ] CLI call returned `success: true` with a non-empty `shareUrl`
- [ ] User has the URL pasted plainly in the chat
- [ ] If creating, the `shareId` is also surfaced so they can update later
- [ ] If any static-scan warnings were emitted, note them so the user knows what might 404

## Next step

If the user mentions recipients ("send this to alice@…", "email the deck"), use the `share-presentation-email` skill with the `shareId` you just received.
