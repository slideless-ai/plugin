---
name: setup-slideless
description: "Set up authentication for the slideless-ai backend so other slideless skills (share-presentation, update-presentation, list-presentations, get-presentation) can call its Cloud Functions. Activate when the user wants to start using slideless for the first time, when share-presentation or any other slideless skill returns 401, or when the user asks how to get a slideless API key."
---

# Slideless Setup

Get a slideless organization API key, store it in the workspace `.env`, and verify it works. After this, all other slideless skills authenticate automatically.

## Prerequisites

- A slideless-ai account (sign up at `https://slideless-ai.web.app` if you don't have one)
- Workspace `.env` file at `~/.codika/.env` (it already exists if you've used Codika before)

## Step 1: Get an organization API key

The dashboard creates the key for you and shows the raw value once:

1. Go to **`https://slideless-ai.web.app`**, sign in if needed
2. Click your organization → **API Keys** in the sidebar (URL pattern: `/organizations/<orgId>/org/api-keys`)
3. Click **Create API key**
4. Name it (e.g. `claude-skill`), select scope `presentations:write` (and optionally `presentations:read`)
5. Copy the raw `cko_…` value when the modal shows it. **This is the only time you'll see it.**

If the user wants to do this from the CLI instead of the dashboard, that's a v2 feature — for v1, the dashboard is the only path.

## Step 2: Store the key in the workspace `.env`

```bash
echo 'SLIDELESS_API_KEY=cko_paste_the_value_here' >> ~/.codika/.env
```

If `~/.codika/.env` doesn't exist, create it. The other slideless skills read this env var.

## Step 3: Verify the key works

```bash
source ~/.codika/.env
curl -sS -X POST \
  -H "X-Process-Manager-Key: $SLIDELESS_API_KEY" \
  https://europe-west1-slideless-ai.cloudfunctions.net/verifyApiKey
```

Expected response (success):
```json
{
  "valid": true,
  "type": "organization",
  "keyPrefix": "cko_xxxxxxxx",
  "keyName": "claude-skill",
  "scopes": ["presentations:write"],
  "organizationName": "<Your workspace name>",
  "expiresAt": null
}
```

If you get `401 Unauthorized` or `valid: false`, the key was mis-pasted or revoked. Repeat Step 1.

## Output checklist

- [ ] User has a `cko_…` key from the slideless-ai dashboard
- [ ] Key is stored as `SLIDELESS_API_KEY` in `~/.codika/.env`
- [ ] `verifyApiKey` returns `valid: true` with the expected scopes
- [ ] Tell the user: "Setup complete. You can now use share-presentation, update-presentation, list-presentations, and get-presentation."

## Pitfalls

- **Wrong scope** → Other skills will return 403 even though the key is valid. Make sure `presentations:write` is selected.
- **Key not loaded by shell** → Don't forget `source ~/.codika/.env` in the same shell session, or restart the terminal.
- **Multiple Codika products** → If the user already has `CODIKA_ADMIN_API_KEY` for codika-app, that's a different key. Slideless uses its own `SLIDELESS_API_KEY`.
- **Wrong header name** → Header must be `X-Process-Manager-Key`, NOT `Authorization: Bearer`. This is the slideless-ai convention (inherited from codika-app-platform).
