---
name: share-presentation
description: Mint a viewer URL for an existing slideless presentation. Use this after `push-presentation` when the user asks to share, send, or publish the URL. Does NOT upload content — that's `push-presentation`. In v0.5, `share` only mints tokens; decks start life unshared.
---

# Share Presentation (mint viewer token)

Wraps `slideless share <id>`. In v0.5, **share** means "grant view access by URL". Uploading content is handled by `push-presentation`. This skill only mints a named token.

Every token is independently revocable. By default tokens follow the latest version; `--to-version <N>` freezes the recipient on a specific version.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `presentation_id` | yes | The presentation to mint a URL for. |
| `name` | optional | Human-readable label (e.g. recipient name). Default: `default`. |
| `to_version` | optional | Pin the token to a specific version (`--to-version N`). Default: follows latest. |

## Prerequisites

- Owner-only. If the caller is a dev collaborator, this fails with `permission-denied`.
- Presentation must exist (run `push-presentation` first if it doesn't).

## Steps

1. Confirm the caller is the owner of `presentation_id` (via `get-presentation` if unclear).
2. Run `slideless share <presentation_id> [--name "…"] [--to-version N] --json`.
3. Parse JSON, return the `shareUrl`. The recipient opens it in a browser — no login required.

## Example JSON

```json
{
  "success": true,
  "data": {
    "tokenId": "01H...",
    "token": "…48-byte…",
    "shareUrl": "https://app.slideless.ai/share/01HXYZ?token=…"
  }
}
```

## Pitfalls

- `share` does not upload. If the user asks to "share a new deck", they probably mean `push-presentation` followed by `share-presentation <id>`.
- A pinned token shows a specific version forever — later pushes don't update that URL.

## Output checklist

- [ ] Give the user the `shareUrl`.
- [ ] Mention the token `name` and whether it's pinned.
- [ ] Offer `unshare-presentation` as the inverse if they change their mind.
