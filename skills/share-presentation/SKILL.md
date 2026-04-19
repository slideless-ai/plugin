---
name: share-presentation
description: Upload a generated HTML presentation to slideless and return a public share URL anyone can open in a browser. Use this after `generate-presentation` when the user asks to share, send, or publish their deck. Also supports updating an existing share in place (same URL, new content).
---

# Share Presentation

Wraps `slideless share` (and `slideless update` when `share_id` is provided). Uploads an HTML file to the slideless backend and returns a public share URL with an unguessable token. Anyone with the URL views the presentation in their browser; no login required.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `html_path` | yes | Path to the local `.html` file to share. |
| `title` | yes | Display title for the presentation (shown in the user's slideless dashboard). Ask the user if not implied by the file. |
| `share_id` | optional | If provided, **updates** the existing presentation at that shareId instead of creating a new one. URL stays the same, view count preserved, version bumped. |

## Prerequisites

- `slideless` CLI installed and authenticated (run `setup-slideless` if not)
- Confirm with `slideless whoami` that the active profile has `presentations:write` scope

## Steps

1. **Validate the input** — confirm the file at `html_path` exists and is non-empty. The CLI rejects payloads over 10 MB; if the file is larger, ask the user to slim down the deck (compress images, inline fewer fonts).

2. **Run the CLI** — pass `--json` so the response shape is stable.

   **Create a new share:**
   ```bash
   slideless share "$HTML_PATH" --title "$TITLE" --json
   ```

   **Update an existing share:**
   ```bash
   slideless share "$HTML_PATH" --title "$TITLE" --update "$SHARE_ID" --json
   # equivalent to: slideless update "$SHARE_ID" "$HTML_PATH" --title "$TITLE" --json
   ```

3. **Parse the JSON** and surface the URL.

   Create response (`success: true`):
   ```json
   {
     "success": true,
     "data": {
       "shareId": "01a3b...",
       "tokenId": "01a3c...",
       "token": "...",
       "shareUrl": "https://..."
     }
   }
   ```

   Update response:
   ```json
   {
     "success": true,
     "data": {
       "shareId": "01a3b...",
       "version": 2,
       "shareUrl": "https://..."
     }
   }
   ```

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
   > Anyone with this link can open it in their browser. The link is unguessable but doesn't require a login. Manage and revoke from `https://app.slideless.ai`.
   > **Tip:** save `shareId: <id>` to update this presentation later — `slideless update <shareId> <new-html>` keeps the same URL.

   For update:
   > Updated to version &lt;version&gt;. Same URL, viewers see the new content on next load.

## Pitfalls

- **No CLI installed** → "command not found". Run `setup-slideless` first.
- **Not logged in** → CLI returns `unauthenticated`. Run `slideless login`.
- **Wrong scope** → 403 / `permission-denied`. The active profile lacks `presentations:write`. Mint a new key in the dashboard with the right scope and re-run `slideless login`.
- **HTML > 10 MB** → 413 / `payload-too-large`. Slim the deck.
- **Updating someone else's share** → 403 / `permission-denied`. Only the original owner can update.
- **Updating an archived share** → 410 / `archived`. Create a fresh one.
- **Local file references in the HTML (images, fonts, JS)** → won't work for viewers. Inline everything as data URIs or use public CDN URLs before sharing.

## Output checklist

- [ ] HTML file exists and was successfully read
- [ ] CLI call returned `success: true` with a non-empty `shareUrl`
- [ ] User has the URL pasted plainly in the chat (not buried in a code block)
- [ ] If creating, the `shareId` is also surfaced so they can update later
- [ ] If anything failed, the error `code` and `message` are surfaced verbatim
