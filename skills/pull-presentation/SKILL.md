---
name: pull-presentation
description: Download a presentation to a local folder so you can edit it and push updates. Works for both decks you own (pick up on another machine) and decks shared with you as a dev collaborator. Writes slideless.json so subsequent `push` commands update the same presentation.
---

# Pull Presentation

Wraps `slideless pull`. Streams every asset of the requested version into a local folder and writes `slideless.json` at the root. After pulling, edit the files and run `slideless push` from inside the folder to publish a new version.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `presentation_id` | yes | The `presentationId` to pull. |
| `destination_path` | optional | Target directory. Default: `./<title-slug>/`. |
| `version` | optional | Specific version to pull. Default: the current version. |
| `force` | optional | Overwrite a non-empty destination directory that isn't already a Slideless deck. |

## Prerequisites

- `slideless` CLI installed + authenticated.
- The caller must be the owner or an active dev collaborator.

## Steps

1. Run `slideless pull <presentation_id> [destination] [--version N] [--force] --json`.
2. Parse the JSON. On success, the deck is written to `path`, `slideless.json` is populated, and the caller can `cd` into the folder and start editing.
3. Report `presentationId`, `version`, `role`, and the destination path.

## Example JSON

```json
{
  "success": true,
  "data": {
    "presentationId": "01HXYZ...",
    "version": 4,
    "role": "dev",
    "path": "/abs/path/to/deck",
    "filesWritten": 12,
    "bytes": 5420998
  }
}
```

## Pitfalls

- Pulling into a non-empty folder without `--force` is refused. Either pick an empty directory or pass `--force` (overwrites files with remote content).
- Role comes back as `owner` or `dev`. A `dev` puller can push, but cannot mint tokens or invite other collaborators.
- If the presentation was recently deleted, you'll see `not-found`.

## Output checklist

- [ ] Report destination path and version.
- [ ] Mention the role so the user knows whether they can share/invite.
- [ ] Suggest next step: edit → `push-presentation` from the destination folder.
