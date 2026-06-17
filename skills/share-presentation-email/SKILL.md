---
name: share-presentation-email
description: Email a shared slideless presentation to one or more recipients. Each recipient gets a unique named link so the sender can track per-recipient opens. Use this when the user says "send this deck to …", "email the presentation to …", or "share via mail to a@b.c". Requires an existing presentationId — run `share-presentation` first if the deck isn't uploaded yet.
---

# Share Presentation — Email

Wraps `slideless share-email`. Sends a branded email to 1–20 recipients with a link to an existing shared presentation. Per-recipient named tokens are minted by default, so the sender sees who opened what in the dashboard.

## When to invoke

Trigger phrases:
- "send this deck to alice@x.com"
- "email the presentation to the sales team"
- "share via mail to a@b.c"
- "forward the slides to these people: …"

If the user says "share" but doesn't mention email, use `share-presentation` instead.

## Preconditions

- The presentation must already be uploaded — you need a `presentationId`. If you don't have one, run `share-presentation` first.
- `slideless` CLI installed and authenticated — if `slideless --version` fails with `command not found`, invoke the `setup-slideless` skill first, then retry.
- Active profile must have `presentations:write` scope.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `presentation_id` | yes | The presentation to send. Obtained from `share-presentation` or `list-presentations`. |
| `emails` | yes | Array of 1–20 recipient email addresses. |
| `message` | optional | Personal note from the sender (≤2000 chars). Rendered in the email body. |
| `subject` | optional | Custom subject line (≤200 chars). Defaults to `"{senderEmail} shared: {title}"`. |
| `token_id` | optional | Reuse a single existing token for every recipient instead of minting per-recipient tokens. Loses per-recipient analytics; only use if the user explicitly asks. |

## Steps

1. **Confirm recipients.** If the user gave an ambiguous list ("send to the team"), ask for explicit addresses. Max 20 per call — if more, batch.

2. **Run the CLI** with `--json` for a stable response shape. Repeat `--to` for multiple recipients:

   ```bash
   slideless share-email "$SHARE_ID" \
     --to "alice@x.com" \
     --to "bob@y.com" \
     --message "$MESSAGE" \
     --json
   ```

   Add `--subject "$SUBJECT"` or `--token-id "$TOKEN_ID"` only if the user specified them.

3. **Parse the JSON.**

   Success response:
   ```json
   {
     "success": true,
     "data": {
       "presentationId": "01a3b...",
       "sent": [
         { "email": "alice@x.com", "tokenId": "...", "resendMessageId": "re_...", "shareUrl": "https://app.slideless.ai/share/..." }
       ],
       "failed": [
         { "email": "bob@y.com", "code": "invalid-email", "message": "Not a valid email address." }
       ],
       "summary": { "total": 2, "sent": 1, "failed": 1 }
     }
   }
   ```

   Note: `failed[]` contains **per-recipient** failures inside an otherwise-successful call. `success: false` only fires when zero emails could be attempted.

   Preflight-failure response:
   ```json
   {
     "success": false,
     "status": 403,
     "error": {
       "code": "permission-denied",
       "message": "API key does not have access to this share.",
       "nextAction": "Confirm the share belongs to the same org as the current API key. If not, ask the user for the correct key."
     }
   }
   ```

4. **Summarize back to the user.**

   All succeeded:
   > Sent "<title>" to 3 recipients: alice@x.com, bob@y.com, carol@z.com.

   Partial:
   > Sent "<title>" to 2 of 3 recipients. Failed: carol@bad (invalid-email — not a valid email address).

   Zero sent (hard failure):
   > Share-email failed: `<error.code>` — `<error.message>`. Following the suggested next action: `<error.nextAction>`.

## Error-code reference

Every failure includes `error.code` and `error.nextAction`. Handle each without asking the user unless the next action explicitly says to.

| `error.code` | When it happens | What to do |
|---|---|---|
| `unauthenticated` | No key / invalid key | Ask the user to run `slideless auth login` or pass `--api-key`, then retry. |
| `permission-denied` | Key isn't the owner, same-org, or an active collaborator | Verify the key belongs to the owner, the owning org, or a collaborator on the presentationId. Ask user for the right key if not. |
| `not-found` | `presentationId` doesn't exist | Double-check the presentationId. If the user just created it, retry once after 2s. |
| `archived` | Share is archived | Tell the user the presentation is archived. Offer to un-archive or create a new share with `share-presentation`. |
| `missing-recipients` | No emails provided | Ask the user for at least one recipient address and retry. |
| `invalid-email` | Bad email syntax | Appears in `failed[]`, not top-level. Show the user which addresses were rejected. |
| `too-many-recipients` | >20 recipients | Split into batches of ≤20 and call multiple times. |
| `message-too-long` | Message >2000 chars | Shorten the message or omit it. |
| `email-send-failed` | Resend API failure | Appears in `failed[]`. Retry once; if persistent, tell the user Resend is having issues. |
| `rate-limited` | Too many calls | Back off 30s, retry. If persistent, stop and tell the user. |
| `internal` | Unhandled backend error | Retry once. If still failing, stop and report verbatim with the presentationId. |

## Worked examples

### 1) Single recipient, no message

```bash
slideless share-email "01a3b2c4d5e6f7" --to "alice@x.com" --json
```

### 2) Multiple recipients with a personal message

```bash
slideless share-email "01a3b2c4d5e6f7" \
  --to "alice@x.com" \
  --to "bob@y.com" \
  --to "carol@z.com" \
  --message "Here's the Q2 deck we discussed — would love your take before Friday." \
  --json
```

### 3) Reusing an existing token (no per-recipient tracking)

```bash
slideless share-email "01a3b2c4d5e6f7" \
  --to "alice@x.com" \
  --token-id "01a3c9d8e7f6g5" \
  --subject "Q2 Pitch — Acme Inc" \
  --json
```

## Pitfalls

- **No presentationId yet** → run `share-presentation` first, then use the returned `presentationId`.
- **Typos in email addresses** → land in `failed[]` with `invalid-email`. Surface them verbatim so the user can correct.
- **"Send to my team"** → Don't invent addresses. Ask for explicit ones.
- **Resend outage** → every recipient comes back as `email-send-failed`. The audit log still records attempts, so the user can see what happened.

## Output checklist

- [ ] All recipient addresses were passed via `--to` flags
- [ ] `--json` was used so the response is parseable
- [ ] You surfaced the per-recipient results (who was sent, who failed and why)
- [ ] If zero recipients succeeded, you surfaced `error.code`, `error.message`, and `error.nextAction` verbatim
- [ ] On hard failure, the command exits non-zero
