---
name: apply-annotations
description: Read the notes in a deck's local .slideless/annotations.json and edit the deck's HTML to address each unprocessed one. This is the "apply review feedback" step — it consumes the local notes file only (run `pull-annotations` first to include reviewer notes), never touches the network, and best-effort anchors each note back to its spot in the deck. Use after `pull-annotations`, before `push-presentation`.
---

# Apply Annotations

This is an **agent skill**, not a thin CLI wrapper — there is no `slideless apply` command. You read the notes file yourself, locate each note's target in the deck, and make the edit.

It works entirely on the **local** `.slideless/annotations.json` file. It **never calls the network**. If you want reviewer notes included, run `pull-annotations` first to merge them into that file; this skill does not fetch anything.

## What's in `.slideless/annotations.json` (schema v2)

A list of notes. Each note:

```jsonc
{
  "id": "…",                  // stable id (used for dedup; do not change)
  "createdAt": "…",
  "processed": false,          // false = Open (act on it); true = Done (skip)
  "note": "make this punchier", // the reviewer's actual request — the instruction
  "entryFile": "index.html",   // which HTML file in the deck the note is on
  "selectedText": "Our revenue grew", // the exact text the reviewer highlighted
  "context": {                 // surrounding text, to disambiguate repeats
    "before": "…text just before…",
    "after": "…text just after…"
  },
  "anchor": {
    "container": {             // which slide/panel the selection sits in
      "kind": "slide",         // e.g. slide | panel | section
      "index": 3,              // 0-based index of that container
      "heading": "Traction"    // its heading text, if any
    },
    "selector": "#slide-3 > .body > p:nth-of-type(2)" // best-effort CSS path
  },
  "deckVersion": 4,            // version the note was left against (informational)
  "source": "local",          // "local" (your `slideless dev` notes) | "hosted" (pulled reviewer notes)
  "author": "Alice"            // who left it (annotator-link name); null for anonymous/local
}
```

`source` and `author` are **informational only** — they tell you who asked and from where. They don't change how you apply the note.

The Open/Done lifecycle is the `processed` boolean: act on `processed: false`, skip `processed: true`.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `path` | optional | Deck folder containing `.slideless/annotations.json` and the HTML. Default: current directory. |
| `only_unprocessed` | optional | Default `true`: apply only notes with `processed: false`. |

## Prerequisites

- A deck folder with `.slideless/annotations.json`. If it's missing or empty, tell the user there are no notes (and that `pull-annotations` collects reviewer notes, `slideless dev` captures their own).
- To include reviewer notes, run `pull-annotations` first.

## Steps

1. Read `.slideless/annotations.json` from the deck (under `path` if given). If absent/empty → report "no notes to apply" and stop.
2. Select the notes to work: every note with `processed: false` (unless told otherwise). Note the counts of local vs hosted for the summary.
3. For **each** selected note, locate its target in `entryFile` using this anchoring ladder (best-effort — earlier signals may have drifted as the deck changed):
   1. **`anchor.selector`** — try the CSS path first. If it resolves to a unique element whose text still matches `selectedText`, that's the spot.
   2. **`anchor.container` + `selectedText`** — if the selector missed (deck edited since), narrow to the slide/panel by `container.kind` + `container.index`, confirm via `container.heading`, then find `selectedText` inside it.
   3. **`selectedText` + `context.before`/`context.after`** — if the container also drifted, search the file for `selectedText` and disambiguate repeats using the surrounding context.
4. Apply the change the `note` asks for at that spot, editing the deck's HTML.
5. **If you truly cannot locate the target** after the full ladder, **do not guess** and do not edit a random spot. Record it as "could not locate" and move on.
6. After all notes, write a per-note summary (below). Suggest `push-presentation` to ship the revision.

## Anchoring: be best-effort, never reckless

The selector and even the selected text **may have drifted** since the note was left (the deck has likely changed). Always fall back down the ladder: selector → container + selectedText → selectedText + context. Apply the change only when you're confident you've found the right place. When in genuine doubt, **report it rather than edit the wrong thing** — a missed note the user can place by hand beats a silent wrong edit.

## Do NOT mark notes processed (just report)

Keep this skill focused on **applying + reporting**. Do **not** flip `processed: false → true` in the file as a side effect — leave the lifecycle to the user/tooling. (The only acceptable exception is a trivially safe, explicit request from the user to mark specific notes done.) Your deliverable is the edits to the deck plus a clear summary.

## Output (per-note summary)

For each note report:

- **Applied** — id, author/source, the request, and what you changed (which file + element/text).
- **Could not locate** — id, author/source, the request, what you tried, and a suggestion for where the user might place it by hand.

Then a one-line tally, e.g. `Applied 5 of 7 notes (4 hosted, 3 local); 2 could not be located.`

## Pitfalls

- **Local file only — no network.** This skill never fetches. Reviewer notes appear here only if `pull-annotations` was run first.
- Don't act on `processed: true` notes (already Done) unless explicitly asked.
- Selectors and selected text drift. Trust the anchoring ladder, not just the selector.
- Multiple notes can target the same area — apply them in a sensible order and re-check anchors as the surrounding text shifts under your edits.
- `source`/`author` never change the edit — a hosted note from "Alice" and a local note are applied the same way.

## Next step

Once the edits look right, run `push-presentation` from the deck folder to ship the new version. Annotator links keep working against the new version, so the loop can repeat.
