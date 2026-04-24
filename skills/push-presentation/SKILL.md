---
name: push-presentation
description: Upload a presentation to slideless. Creates a new deck on first run (writes slideless.json locally so subsequent pushes update instead of creating duplicates), updates the existing deck on subsequent runs. Use this whenever the user asks to publish, upload, save, or update a deck.
---

# Push Presentation

Wraps `slideless push`. This replaced the pre-v0.5 `share <path>` and `update <id> <path>` commands — there is now **one** way to upload content regardless of whether the deck is new or existing.

Slideless decks are either a folder (with `index.html` + sibling assets) or a single `.html` file. Relative paths inside the deck resolve naturally. Paths that escape the deck root (`../outside/foo.jpg`) are rejected.

The first successful push writes `slideless.json` at the deck root. That file is how `slideless push` and `slideless pull` know which presentation this folder belongs to.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `source_path` | yes | Path to a folder or a single `.html` file. Default: current directory. |
| `title` | on first push | Display title for the presentation. Required when no `slideless.json` exists yet; optional on updates. |
| `entry` | optional | Entry HTML file name (folder mode). Default: `index.html`. |
| `force` | optional | Bypass the version-conflict check on updates. Use only after you've confirmed you want to overwrite what's on the server. |
| `strict` | optional | Fail on any unresolved static reference. Default: warnings only. |
| `message` | optional | Short commit-style note, logged server-side. |

## Prerequisites

- `slideless` CLI installed + authenticated (run `setup-slideless` otherwise).
- `slideless whoami` shows `presentations:write` scope.
- CLI version ≥ 0.5.0.

## Steps

1. Verify the CLI + auth (run `slideless --version` and `slideless whoami` if you're not sure).
2. Decide new vs update by checking if `slideless.json` exists at `source_path`.
3. Run `slideless push <source_path> [--title "…"] [--entry index.html] [--strict] [--force] [--message "…"] --json`.
4. Parse JSON. Report `presentationId`, `version`, `role`, and whether it was new. The local `slideless.json` has been written/updated — mention this so the user knows the folder is now "linked".
5. If a new presentation, remind the user it's **unshared** by default. Mint a viewer URL on demand via `share-presentation`.

## Example JSON (new)

```json
{
  "success": true,
  "data": {
    "presentationId": "01HXYZ...",
    "version": 1,
    "role": "owner",
    "assetsUploaded": 8,
    "assetsDeduped": 0,
    "totalBytes": 4312345,
    "isNew": true,
    "slidelessJson": "slideless.json"
  }
}
```

## Example JSON (conflict on update)

```json
{
  "success": false,
  "status": 409,
  "error": {
    "code": "conflict",
    "message": "Server is at version 5, client expected 3.",
    "nextAction": "Remote has a newer version (v5). Run `slideless pull <id>` to sync, or pass --force to overwrite.",
    "details": { "serverVersion": 5, "expectedBaseVersion": 3 }
  }
}
```

## Pitfalls

- Don't manually delete `slideless.json` — it's how the CLI knows a folder is a Slideless deck. Run `slideless pull <id>` if the folder was lost.
- `--force` overwrites the remote collaborator's in-flight edits. Prefer `slideless pull && slideless push`.
- The entry file must live inside the deck root. Slideless won't follow `../`.

## Output checklist

- [ ] Report `presentationId` and `version`.
- [ ] Mention the role (`owner` vs `dev`).
- [ ] Tell the user whether a viewer URL was created (`push` does not — use `share-presentation`).

## Next step

After creating a brand-new deck, most users will want to run `share-presentation <id>` to mint a viewer URL, or `invite-collaborator <id> --email …` to add a dev.
