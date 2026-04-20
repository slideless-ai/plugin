---
name: setup-slideless
description: "Bootstrap the slideless CLI so other slideless skills (share-presentation, update-presentation, list-presentations, get-presentation) can call its API. Activate when the user wants to start using slideless for the first time, when share-presentation or any other slideless skill returns 401, or when the user asks how to get a slideless API key. Runs the OTP-based signup or login flow via `slideless auth ...`; falls back to pasting a dashboard key if the user already has one."
---

# Slideless Setup

Install the `slideless` CLI and attach an organization API key to this machine. After this, every other slideless skill authenticates automatically: no env vars, no header juggling.

The preferred path is **OTP from the terminal** — two commands and the key is minted and saved. No browser visit required. Dashboard-paste is available as a fallback for users who already have a `cko_`.

## Prerequisites

- Node.js 20+
- An email address the user can check (for the OTP path)
- The user's first name (required for signup — used in onboarding emails and as the default workspace name; last name is optional)

## Step 1: Install the CLI

```bash
npm install -g slideless
slideless --version
```

If `npm install -g` is blocked, `npx slideless ...` works for any command (slower).

## Step 2: Pick a path

Ask the user which applies — don't guess:

- **No slideless account yet** → **Path A: OTP signup** (most common for first-time use).
- **Account exists, but this machine has no key (or the current key is bad)** → **Path B: OTP login**.
- **User already copied a `cko_...` from the dashboard** → **Path C: paste** (fallback).

If the user is unsure, start with Path A. The backend tells you (via `USER_ALREADY_HAS_ORGANIZATION`) if you should switch to Path B, and vice versa. Handle that branching automatically — don't make the user figure it out.

## Path A — OTP signup

```bash
slideless auth signup-request --email $EMAIL --json
```

Expected success shape:

```json
{ "success": true, "data": { "email": "...", "expiresInSeconds": 600 } }
```

Tell the user "I sent a 6-digit code to `<email>` — paste it back when you have it" and wait. Before running `signup-complete`, make sure you have the user's first name (see "Gathering the user's name" below — don't skip it; `--first-name` is required and the CLI will fail fast without it). Then:

```bash
slideless auth signup-complete --email $EMAIL --code $OTP --first-name "$FIRST_NAME" --json
```

Optional flags for providing a last name and populating the new organization at the same time. The CLI base64-encodes the logo for you.

```bash
slideless auth signup-complete --email $EMAIL --code $OTP --json \
  --first-name "Romain" \
  --last-name "Pattyn" \
  --company "Acme" \
  --description "We make widgets" \
  --brand-primary "#0a0a0a" \
  --logo ./logo.png
```

### Gathering the user's name

Prefer asking the user directly — `"What's your first name?"` is one turn and gives you clean data. If running non-interactively and the user hasn't told you, fall back to `git config user.name` and take the first whitespace-separated token; if that's also empty, stop and ask rather than guessing. Never pass the email local part as the first name — the backend used to do that and produced emails greeting users as "My, your first steps".

Expected success shape:

```json
{
  "success": true,
  "data": {
    "profileName": "romains-workspace",
    "organizationId": "...",
    "organizationName": "Romain's workspace",
    "apiKey": { "keyPrefix": "cko_xxxx", "name": "CLI default key", "scopes": ["presentations:write","presentations:read"], "createdAt": "..." },
    "isNewUser": true
  }
}
```

The `cko_` key is saved to `~/.config/slideless/config.json` and set as the active profile. Surface `organizationName`, `organizationId`, and `keyPrefix` to the user.

**Branching**: if `signup-request` returns `USER_ALREADY_HAS_ORGANIZATION`, switch to **Path B** (the user already has an account; OTP login gives them a fresh key).

## Path B — OTP login

```bash
slideless auth login-request --email $EMAIL --json
slideless auth login-complete --email $EMAIL --code $OTP --json
```

Same flow, same response shape. Each `login-complete` mints a **new** `cko_` key scoped to the existing organization; previous keys stay valid until revoked from the dashboard.

**Branching**: if `login-request` returns `USER_NOT_FOUND` or `USER_HAS_NO_ORGANIZATION`, switch to **Path A**.

## Path C — Paste a dashboard key (fallback)

Only use this if the user explicitly has a key already (they say so, or they paste a `cko_...` at you):

```bash
slideless login --api-key cko_xxxx     # non-interactive
# or
slideless login                        # interactive, masked prompt
```

If the user doesn't have a key and asks where to get one, direct them back to Path A/B (they'll be done in 30 seconds) rather than walking them through the dashboard.

## Step 3: Verify

```bash
slideless whoami --json
```

Must return `success: true` with an `organizationName`, `keyPrefix` starting with `cko_`, and scopes `presentations:write` + `presentations:read`.

## Error-handling table

Every `slideless auth ...` error payload carries a `nextAction` string — use it. Pass it through to the user verbatim when surfacing failures; its wording is chosen to be actionable.

| Code | What to do |
|---|---|
| `OTP_RESEND_COOLDOWN` (`details.retryInSeconds`) | Wait the number of seconds, then re-run the `-request`. |
| `OTP_EXPIRED`, `OTP_NOT_FOUND`, `OTP_ALREADY_USED`, `OTP_LOCKED_OUT` | Re-run the matching `-request` to get a fresh code. |
| `OTP_INVALID` (`details.attemptsRemaining`) | Ask the user to re-check the email; they have `attemptsRemaining` tries before lockout. |
| `OTP_PURPOSE_MISMATCH` | Happens if you crossed signup and login flows. Re-run the matching `-request`. |
| `USER_ALREADY_HAS_ORGANIZATION` | Switch from Path A → Path B. |
| `USER_NOT_FOUND` / `USER_HAS_NO_ORGANIZATION` | Switch from Path B → Path A. |
| `EMAIL_RATE_LIMITED` / `IP_RATE_LIMITED` | 20/hour per email or 60/hour per IP hit. Wait and retry. |
| `LOGO_TOO_LARGE` / `LOGO_INVALID_FORMAT` / `LOGO_DECODE_FAILED` | Drop `--logo` and retry, or pick a smaller/valid file (PNG/JPEG/WebP/SVG ≤ 2 MB). |
| `BRAND_COLOR_INVALID` | Use a 6-digit hex like `#0a0a0a`, or omit the flag. |
| `USER_FIRST_NAME_REQUIRED` | `--first-name` was missing. Ask the user for their first name and retry. |
| `USER_NAME_TOO_LONG` (`details.field`) | Shorten the offending `--first-name` / `--last-name` to ≤ 60 chars. |
| `COMPANY_NAME_TOO_LONG` | Shorten `--company` to ≤ 100 chars, or omit (defaults to "{first-name}'s workspace"). |
| `INVALID_EXPIRES_IN_DAYS` | Omit `--key-expires-in` or pass 1–365. |
| `INTERNAL` | Retry in a few seconds. |

## Output checklist

- [ ] `slideless --version` prints a version number.
- [ ] The active profile in `~/.config/slideless/config.json` has a `cko_` key and both `presentations:write` and `presentations:read` scopes.
- [ ] `slideless whoami --json` returns `success: true`.
- [ ] Tell the user which organization they are logged into, the masked key prefix, and that other slideless skills (share / update / list / get) will now work.

## Pitfalls

- **Starting interactively without an email.** The OTP path requires `--email`; don't try `slideless auth signup-request` with no flags.
- **Falling back too fast.** If a signup hits `USER_ALREADY_HAS_ORGANIZATION`, that's a useful signal — switch to login, don't ask the user for a pasted key.
- **Leaking the code.** The 6-digit OTP arrives by email. Accept it from the user, but never echo it to shared logs.
- **Confusing the two Codika keys.** `CODIKA_ADMIN_API_KEY` (for the main Codika platform) is a different backend with a different key format (`ck_…`). Slideless uses `cko_…` and has its own `~/.config/slideless/config.json`; the two do not conflict.
- **CLI not on PATH after `npm install -g`.** Check `npm prefix -g` and ensure that bin dir is on PATH, or fall back to `npx slideless ...`.
