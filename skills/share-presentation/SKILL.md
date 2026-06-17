---
name: share-presentation
description: Mint a viewer URL for an existing slideless presentation. Use this after `push-presentation` when the user asks to share, send, or publish the URL. Pass `annotator` to mint a link whose holder can leave notes in the viewer (a review link). Does NOT upload content — that's `push-presentation`. In v0.5, `share` only mints tokens; decks start life unshared.
---

# Share Presentation (mint viewer token)

Wraps `slideless share <id>`. In v0.5, **share** means "grant view access by URL". Uploading content is handled by `push-presentation`. This skill only mints a named token.

Every token is independently revocable. By default tokens follow the latest version; `--to-version <N>` freezes the recipient on a specific version.

## Two kinds of link

- **Plain viewer link** (default) — read-only. The holder can view the deck in the browser. Nothing else.
- **Annotator link** (`annotator: true` → `--annotator`) — read + comment. The holder can **select text in the shared viewer and leave notes** on the deck, like a Google-Docs reviewer. Use this when you want feedback, not just eyeballs.

`--annotator` **requires** `--name` — the name labels the link **and** becomes the **author** stamped on every note that link's holder leaves. So name it after the reviewer (e.g. `--name "Alice"`), not `default`. Mint one annotator link per reviewer so you can tell who wrote what.

Reviewers' notes live on the server. The owner later collects them with `pull-annotations`, then applies them with `apply-annotations`, then ships the revision with `push-presentation`. See **Next step**.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `presentation_id` | yes | The presentation to mint a URL for. |
| `name` | optional (REQUIRED if `annotator`) | Human-readable label. For a plain link: defaults to `default`. For an annotator link: required, and becomes the **note author** — use the reviewer's name. |
| `annotator` | optional (boolean) | `true` → `--annotator`: mint a review link whose holder can leave notes in the viewer. Requires `name`. Default: `false` (plain read-only link). |
| `to_version` | optional | Pin the token to a specific version (`--to-version N`). Default: follows latest. |

## Prerequisites

- Owner or active dev collaborator. Anyone else gets `permission-denied`.
- Presentation must exist (run `push-presentation` first if it doesn't).

## Steps

1. Confirm the caller is the owner or an active collaborator of `presentation_id` (via `get-presentation` if unclear).
2. If `annotator` is requested and no `name` was given, **ask for one** (it becomes the note author) — do not fall back to `default`.
3. Run `slideless share <presentation_id> --name "…" [--annotator] [--to-version N] --json`.
   - Plain link: omit `--annotator` (and `--name` may be omitted too).
   - Annotator link: include `--annotator` **and** `--name "<reviewer>"`.
4. Parse JSON, return the `shareUrl`. The recipient opens it in a browser — no login required.

## Example JSON (plain read-only link)

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

## Example JSON (annotator link, `--annotator --name "Alice"`)

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

Same shape — the difference is server-side: this token's holder can leave notes (authored as "Alice") in the viewer. Hand them the URL exactly as you would a plain link.

## Pitfalls

- `share` does not upload. If the user asks to "share a new deck", they probably mean `push-presentation` followed by `share-presentation <id>`.
- A pinned token shows a specific version forever — later pushes don't update that URL.
- `--annotator` without `--name` is rejected by the CLI. Always supply a name for review links.
- An annotator link's name is the **author** on its notes. Reusing one name across multiple reviewers makes their notes indistinguishable — mint one named link per reviewer.

## Output checklist

- [ ] Give the user the `shareUrl`.
- [ ] State whether it's a **plain** (read-only) or **annotator** (can leave notes) link.
- [ ] Mention the token `name` (and, for annotator links, that it's the note author) and whether it's pinned.
- [ ] Offer `unshare-presentation` as the inverse if they change their mind.

## Next step

For an annotator link, the review loop is:

```
share-presentation --annotator → reviewers leave notes in the browser
  → pull-annotations  (owner collects their notes into the deck's .slideless/annotations.json)
  → apply-annotations (edit the deck to address each note)
  → push-presentation (ship the new version)
```
