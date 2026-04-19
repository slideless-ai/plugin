---
name: share-presentation
description: Upload a generated HTML presentation to the slideless-ai backend and return a public share URL anyone can open in a browser. Use this after `generate-presentation` when the user asks to share, send, or publish their deck. Also supports updating an existing share in place (same URL, new content).
---

# Share Presentation

Takes a path to a local `.html` file and returns a public link of the form `https://europe-west1-slideless-ai.cloudfunctions.net/getSharedPresentation/<shareId>?token=<token>` (or whatever custom domain `slideless-ai` is mapped to). Anyone with the URL opens the presentation in their browser; the underlying viewer enforces the token, so the link is unguessable but does not require login.

The HTML is hosted by the slideless-ai backend. View counts are tracked per-token. Shares can be revoked. The same URL can be updated in place (re-publish without breaking existing links).

## Inputs

| Input | Required | Notes |
|---|---|---|
| `html_path` | yes | Absolute path to the local `.html` file to share. |
| `title` | yes | Display title for the presentation (shown in the user's slideless dashboard). Ask the user if not implied by the file. |
| `share_id` | optional | If provided, **updates** the existing presentation at that shareId instead of creating a new one. URL stays the same, view count preserved, version bumped. |

## Prerequisites

The skill needs a slideless API key to authenticate the upload.

1. Read `SLIDELESS_API_KEY` from `~/.codika/.env`. The key starts with `cko_` (organization API key).
2. If not present, fall back to the `SLIDELESS_API_KEY` environment variable.
3. If still not found, stop and tell the user: **"I need a Slideless API key. Sign in at the slideless-ai dashboard, create an organization API key, and add `SLIDELESS_API_KEY=cko_...` to `~/.codika/.env` (or export it in your shell)."**

## Steps

1. **Validate the input** — confirm the file at `html_path` exists and is non-empty. If it's larger than 10 MB (the backend's hard limit), refuse and ask the user to slim down the deck (e.g. inline fewer base64 images).

2. **Read the HTML** from disk.

3. **Resolve the API key** as described in "Prerequisites".

4. **POST to the upload endpoint** using `curl`:

   ```bash
   # CREATE — new presentation
   curl -sS -X POST \
     -H "X-Process-Manager-Key: $SLIDELESS_API_KEY" \
     -H "Content-Type: application/json" \
     --data-binary @<(jq -Rs --arg title "$TITLE" '{html: ., title: $title}' < "$HTML_PATH") \
     "https://europe-west1-slideless-ai.cloudfunctions.net/uploadSharedPresentation"

   # UPDATE — same shareId, new content (URL unchanged)
   curl -sS -X POST \
     -H "X-Process-Manager-Key: $SLIDELESS_API_KEY" \
     -H "Content-Type: application/json" \
     --data-binary @<(jq -Rs --arg id "$SHARE_ID" --arg title "$TITLE" '{shareId: $id, html: ., title: $title}' < "$HTML_PATH") \
     "https://europe-west1-slideless-ai.cloudfunctions.net/updateSharedPresentation"
   ```

   **Auth header is `X-Process-Manager-Key`, NOT `Authorization: Bearer`** — that's the slideless-ai convention for API key auth.

   Expected create response:
   ```json
   {
     "shareId": "01a3b...",
     "tokenId": "01a3c...",
     "token": "secret_base64url_string",
     "shareUrl": "https://europe-west1-slideless-ai.cloudfunctions.net/getSharedPresentation/01a3b...?token=secret_..."
   }
   ```

   Expected update response:
   ```json
   {
     "shareId": "01a3b...",
     "version": 2,
     "shareUrl": "https://...?token=..."
   }
   ```

5. **Present the URL to the user**. Format for create:
   > Your presentation is live: **<shareUrl>**
   > Anyone with this link can open it in their browser. The link is unguessable but doesn't require a login. You can manage and revoke it from the slideless-ai dashboard.
   > **Tip:** Save `shareId: <id>` if you want to update this presentation later — re-running with `share_id` keeps the same URL.

   For update:
   > Updated to version <version>. Same URL, viewers see the new content on next load.

## Backend Endpoints (reference)

| Action | Method | URL |
|---|---|---|
| Create | POST | `https://europe-west1-slideless-ai.cloudfunctions.net/uploadSharedPresentation` |
| Update | POST | `https://europe-west1-slideless-ai.cloudfunctions.net/updateSharedPresentation` |
| View (public) | GET | `https://europe-west1-slideless-ai.cloudfunctions.net/getSharedPresentation/<shareId>?token=<token>` |

These URLs change if a custom domain is later added (e.g. `https://app.slideless.ai/share/<id>?token=...`). Update this skill when that happens.

## Pitfalls

- **Wrong header name** → 401 with `"Invalid or missing API key"`. Header must be `X-Process-Manager-Key`, not `Authorization: Bearer`.
- **Wrong key prefix** → 401. Keys must start with `cko_` (organization) or `cka_` (admin). Personal `ckp_` keys are not yet supported by the slideless backend.
- **HTML > 10 MB** → 413 with `"payload-too-large"`. Slim the deck (compress images, inline fewer fonts).
- **Updating someone else's share** → 403 with `"permission-denied"`. Only the owner of the original upload can update.
- **Updating an archived share** → 410 with `"archived"`. Create a fresh one instead.
- **Local file references in the HTML (images, fonts, JS)** → won't work for viewers. Inline everything as data URIs or use public CDN URLs before sharing.

## Output Checklist

Before declaring done:

- [ ] HTML file exists and was successfully read
- [ ] API key was resolved (told the user where it came from)
- [ ] Upload returned 200 with a non-empty `shareUrl`
- [ ] User has the URL pasted plainly in the chat (not buried in a code block)
- [ ] If creating, the `shareId` is also surfaced so they can update later
- [ ] If anything failed, the error message + status code is surfaced verbatim
