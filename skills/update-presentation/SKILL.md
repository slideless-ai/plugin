---
name: update-presentation
description: "Replace the contents of an existing shared presentation in place. The shareId and share URL stay the same so existing recipients see the new content on their next page load. View counts and tokens are preserved. Unchanged assets are deduplicated — only modified files re-upload. Use this when iterating on a deck after edits."
---

# Update Presentation

Wraps `slideless update`. Replaces the deck at an existing share with a new version. Same URL, new content, version bumps, view count preserved, unchanged assets deduplicated (content-addressed — a single replaced image triggers only that one blob to re-upload).

## Inputs

| Input | Required | Notes |
|---|---|---|
| `share_id` | yes | The `shareId` returned by a previous `share-presentation` call (in chat history, dashboard URL, or `slideless list` output). |
| `source_path` | yes | Path to either a folder containing the updated deck (with entry HTML) or a single `.html` file. |
| `entry` | optional | Entry HTML file name inside the folder. Default `index.html`. |
| `title` | optional | New title. If omitted, the existing title is kept. |
| `strict` | optional | If true, fail on any unresolved relative reference found by the pre-upload static scan. Default: warnings only. |

## Prerequisites

- `slideless` CLI installed and authenticated — if `slideless --version` fails with `command not found`, invoke the `setup-slideless` skill first, then retry.
- CLI version ≥ 0.3.0 (folder mode). Re-run `setup-slideless` if older.
- The user must own the presentation (ownership is checked server-side).

## Steps

1. **Validate** — confirm the folder or file exists. For folder mode, confirm the entry HTML is present.

2. **Run the CLI** with `--json`:

```bash
# Folder, no title change:
slideless update "$SHARE_ID" "$SOURCE_PATH" --json

# Folder with custom entry + title change:
slideless update "$SHARE_ID" "$SOURCE_PATH" --entry "$ENTRY" --title "$NEW_TITLE" --json

# Single HTML file:
slideless update "$SHARE_ID" "$HTML_PATH" --json
```

## Expected response

```json
{
  "success": true,
  "data": {
    "shareId": "01a3b…",
    "version": 2,
    "shareUrl": "https://…",
    "assetsUploaded": 1,
    "assetsDeduped": 4,
    "totalBytes": 12345678
  }
}
```

Tell the user: "Updated to version &lt;N&gt;. Same URL — recipients see the new content on next load. &lt;assetsDeduped&gt; assets were deduplicated (not re-uploaded)."

## Pitfalls

- **Wrong shareId** → `not-found`. Confirm with `slideless list` or check the dashboard URL.
- **Updating someone else's presentation** → `permission-denied`. Only the original owner can update.
- **Updating an archived presentation** → `archived`. Create a fresh one with `share-presentation` instead.
- **Parent-directory references** (`../foo.jpg`) are always rejected — decks must be self-contained.
- **Deck too large** → `payload-too-large`. Free tier: 50 MB/file, 250 MB total. Compress videos or drop unused files.
- **No `presentations:write` scope** → `permission-denied`. Re-run `setup-slideless`.

## Version pinning reminder

Each token on the presentation has a `versionMode`. Tokens set to `{type: 'latest'}` (the default) will auto-follow this update. Tokens pinned to an earlier version (`{type: 'pinned', version: N}`) will continue to see that older version — this is intentional. Use `slideless pin <shareId> <tokenId> --version <N>` or `--latest` to change a token's mode.

## Output checklist

- [ ] Folder/file exists and contains the entry HTML
- [ ] CLI returned `success: true` with `version > previous version`
- [ ] Report `assetsUploaded` and `assetsDeduped` counts so the user can see dedup worked
- [ ] Surface the unchanged share URL (same as before — no need to re-distribute)
- [ ] On error, surface the `code` and `message` verbatim
