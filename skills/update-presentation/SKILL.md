---
name: update-presentation
description: "Replace the HTML of an existing shared presentation in place. The shareId and share URL stay the same so existing recipients see the new content on their next page load. View counts and tokens are preserved. Use this when the user asks to update, refresh, or republish a presentation they've already shared, or when iterating on a deck after small edits."
---

# Update Presentation

Wraps `slideless update`. Replaces the HTML at an existing share. Same URL, new content, version bumps, view count preserved.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `share_id` | yes | The `shareId` returned by a previous `share-presentation` call (in chat history, dashboard URL, or `slideless list` output). |
| `html_path` | yes | Path to the local `.html` file with the updated content. |
| `title` | optional | New title. If omitted, the existing title is kept. |

## Prerequisites

- `slideless` CLI installed and authenticated — if `slideless --version` fails with `command not found`, invoke the `setup-slideless` skill first, then retry.
- The user must own the presentation being updated (ownership is checked server-side)

## Steps

1. **Validate** — confirm the file at `html_path` exists and is non-empty (CLI rejects > 10 MB)
2. **Run the CLI** with `--json`:

```bash
# Without title change:
slideless update "$SHARE_ID" "$HTML_PATH" --json

# With title change:
slideless update "$SHARE_ID" "$HTML_PATH" --title "$NEW_TITLE" --json
```

## Expected response

```json
{
  "success": true,
  "data": {
    "shareId": "01a3b…",
    "version": 2,
    "shareUrl": "https://…"
  }
}
```

Tell the user: "Updated to version &lt;N&gt;. Same URL — recipients see the new content on next load."

## Pitfalls

- **Wrong shareId** → `not-found`. Confirm with `slideless list` or check the dashboard URL.
- **Updating someone else's presentation** → `permission-denied`. Only the original owner can update.
- **Updating an archived presentation** → `archived`. Create a fresh one with `share-presentation` instead.
- **HTML > 10 MB** → `payload-too-large`. Slim the deck.
- **No `presentations:write` scope** → `permission-denied`. Re-run `setup-slideless` and pick the right scope.

## Output checklist

- [ ] HTML file exists and is non-empty
- [ ] CLI returned `success: true` with `version > previous version`
- [ ] Surface the unchanged share URL to the user (same as before — no need to re-distribute)
- [ ] On error, surface the `code` and `message` verbatim
