---
name: pull-annotations
description: Collect reviewer notes left on a hosted presentation into the deck's local .slideless/annotations.json, so you can act on them. Owner-only. Use this after sharing an annotator link (`share-presentation --annotator`) and giving reviewers time to comment. Merges by note id — additive, never clobbers your local notes. Follow with `apply-annotations` to edit the deck.
---

# Pull Annotations

Wraps `slideless pull-annotations`. Reviewers who hold an **annotator link** (minted by `share-presentation --annotator`) leave notes in the shared viewer. Those notes live on the server. This skill **downloads them and merges them into the deck's local `.slideless/annotations.json`** so a local agent can read and act on them.

The merge is **deduped by note id** and **additive**: it never overwrites or deletes notes you already have locally. Pulled reviewer notes are stamped `source: "hosted"`; your own notes (captured by `slideless dev`) stay `source: "local"`. Re-running is safe — already-pulled notes are skipped.

This skill only **fetches** notes. It does not edit the deck. That's `apply-annotations`.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `presentation_id` | resolves from `slideless.json` | The deck whose hosted notes to pull. **Omit it when running inside a linked deck folder** — the CLI reads the id from `slideless.json` and defaults to that deck's version. Pass an explicit `<presentationId>` to pull **across all versions**. |
| `version` | optional | `--at <N>`: pull notes left against a specific version. Default: the deck's current version when resolved from `slideless.json`; all versions when an explicit id is given. |
| `path` | optional | `--path <dir>`: the deck folder to merge notes into (where `.slideless/` lives). Default: current directory. |

## Prerequisites

- `slideless` CLI installed + authenticated (run `setup-slideless` otherwise).
- **Owner or active dev collaborator.** Anyone else gets `permission-denied`.
- A linked deck folder (has `slideless.json`) if you omit `presentation_id`.

## Steps

1. Decide the target: inside a linked deck folder, run with no id to default to that deck's version; otherwise pass the explicit `<presentation_id>` to sweep all versions.
2. Run `slideless pull-annotations [<presentation_id>] [--at <version>] [--path <dir>] --json`.
3. Parse the JSON `data`: `pulled` (new notes merged in), `skipped` (already present, deduped), `total` (notes now in the local file).
4. Report the counts and point the user at the local file: `.slideless/annotations.json`.
5. If `pulled > 0`, suggest `apply-annotations` to act on them.

## Example JSON (success)

```json
{
  "success": true,
  "data": {
    "pulled": 4,
    "skipped": 2,
    "total": 6
  }
}
```

Read this as: 4 new reviewer notes merged in, 2 were already local (skipped), the deck now holds 6 notes total.

## Example JSON (not found)

```json
{
  "success": false,
  "status": 404,
  "error": {
    "code": "not-found",
    "message": "No presentation with that id, or it was deleted."
  }
}
```

## Example JSON (unauthenticated / no access)

```json
{
  "success": false,
  "status": 401,
  "error": {
    "code": "unauthenticated",
    "message": "No valid API key. Run `setup-slideless`, or you are not the owner or a collaborator on this deck."
  }
}
```

## Pitfalls

- **Owner or active dev collaborator only.** Anyone else gets `unauthenticated` / `permission-denied` here.
- This merges into the deck's **local** `.slideless/annotations.json`. If you run it from the wrong folder (or without `--path`), the notes land in the wrong place. Run it from the deck root, or pass `--path`.
- Re-pulling is **additive and idempotent** — it tops up new notes and skips ones you already have; it never wipes local notes.
- Omitting the id resolves to the linked deck's current version; passing an explicit id pulls across **all** versions. Use `--at <N>` to narrow.

## Output checklist

- [ ] Report `pulled`, `skipped`, and `total`.
- [ ] Name the local file the notes landed in: `.slideless/annotations.json`.
- [ ] If anything was pulled, suggest the next step.

## Next step

Run `apply-annotations` to read the local notes and edit the deck to address each one, then `push-presentation` to ship the new version.
