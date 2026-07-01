# flowm

flowm is a Next.js app where a user gives one natural language instruction (for example, "summarize my GitHub notifications") and a 3-agent pipeline (Interpreter → Fetcher → Actor) executes it, logging every action to a Soroban smart contract on Stellar testnet.

## Live Demo

After you deploy to Vercel, add your production URL here:

**Production URL:** `https://your-project.vercel.app` _(replace after deploy)_

## Prerequisites

- [Bun](https://bun.sh) (or Node.js 20+ with npm/pnpm)
- A [GitHub account](https://github.com) for OAuth
- The [Freighter](https://www.freighter.app/) browser extension (Stellar testnet)
- A funded **Stellar testnet** account for server-side signing (`STELLAR_SECRET_KEY`)

## Local setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd flowm
bun install
```

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in every value in `.env.local`. See [Environment variables](#environment-variables) below.

### 3. GitHub OAuth (local)

Create a **GitHub OAuth App** at [github.com/settings/developers](https://github.com/settings/developers):

| Field | Local value |
|---|---|
| Application name | `flowm local` (any name) |
| Homepage URL | `http://localhost:3000` |
| Authorization callback URL | `http://localhost:3000/api/auth/callback/github` |

Copy **Client ID** → `GITHUB_ID` and **Client secret** → `GITHUB_SECRET`.

> **Note:** Each GitHub OAuth App allows **one** callback URL. For production you need a **second OAuth App** (or update the callback when switching environments). See [Deploy to Vercel](#deploy-to-vercel).

Requested scopes: `read:user`, `user:email`, `notifications`.

### 4. NextAuth secret

```bash
openssl rand -base64 32
```

Set the output as `NEXTAUTH_SECRET` and keep `NEXTAUTH_URL=http://localhost:3000`.

### 5. Stellar testnet signing account

The Actor agent submits `log_action` with a **server-funded** testnet account (not Freighter):

1. Create or fund a testnet account (e.g. via [Stellar Laboratory Faucet](https://laboratory.stellar.org/#account-creator?network=test)).
2. Set `STELLAR_SECRET_KEY` in `.env.local` to that account's secret key.
3. Defaults for `STELLAR_NETWORK_PASSPHRASE`, `STELLAR_RPC_URL`, and `STELLAR_CONTRACT_ID` are pre-filled in `.env.local.example` for the deployed flowm contract.

Freighter is still required in the UI so users connect a Stellar identity; logging is performed by the server account.

### 6. Run locally

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000):

1. Dismiss or read the **getting started** banner (GitHub → wallet → instruction).
2. Click **Sign in with GitHub** in the header.
3. Click **Connect Wallet** (Freighter on testnet).
4. Type an instruction such as **Summarize my GitHub notifications** and click **Send**.
5. Open the **Audit Trail** tab to see on-chain history.

### 7. Verify the build

```bash
bun run build
bun test lib
```

Both should pass with no errors before deploying.

## Deploy to Vercel

### 1. Push to GitHub

Push this repo to a GitHub repository Vercel can import.

### 2. Import in Vercel

1. [vercel.com/new](https://vercel.com/new) → import the repo.
2. Framework preset: **Next.js** (auto-detected).
3. Build command: `bun run build` (or `next build` if using npm).
4. Install command: `bun install` (or `npm install`).

### 3. Production GitHub OAuth App

Create a **separate** OAuth App for production:

| Field | Production value |
|---|---|
| Homepage URL | `https://your-project.vercel.app` |
| Authorization callback URL | `https://your-project.vercel.app/api/auth/callback/github` |

Use this app's Client ID/secret for Vercel env vars (not your local dev app).

### 4. Vercel environment variables

Add **all** variables from `.env.local.example` in Vercel → Project → Settings → Environment Variables:

| Variable | Production notes |
|---|---|
| `NEXTAUTH_URL` | `https://your-project.vercel.app` (must match deployed URL exactly) |
| `NEXTAUTH_SECRET` | Same or new secret; generate with `openssl rand -base64 32` |
| `GITHUB_ID` / `GITHUB_SECRET` | From your **production** OAuth App |
| `STELLAR_*` | Same testnet contract defaults; set `STELLAR_SECRET_KEY` for your funded server account |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional; recommended for error monitoring |
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED` | Leave unset in production (Analytics auto-enables on Vercel) |

Redeploy after changing env vars.

### 5. Enable Vercel Analytics (optional)

Project → **Analytics** → enable **Web Analytics** to see page views and custom events (`instruction_succeeded`, `feedback_submitted`, etc.).

### 6. Post-deploy checklist

- [ ] GitHub sign-in completes without redirect errors
- [ ] Freighter connects on testnet
- [ ] An instruction runs end-to-end and appears in **Audit Trail**
- [ ] Update the **Live Demo** URL at the top of this README

## Environment variables

Full list (copy from `.env.local.example`):

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_SECRET` | Yes | Encrypts session cookies |
| `NEXTAUTH_URL` | Yes | Public app URL (local or production) |
| `GITHUB_ID` | Yes | GitHub OAuth App client ID |
| `GITHUB_SECRET` | Yes | GitHub OAuth App client secret |
| `STELLAR_NETWORK_PASSPHRASE` | Yes | Testnet passphrase (default in example) |
| `STELLAR_RPC_URL` | Yes | Soroban RPC URL (default in example) |
| `STELLAR_CONTRACT_ID` | Yes | Deployed audit-log contract ID |
| `STELLAR_SECRET_KEY` | Yes | Server signing key for `log_action` |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry error monitoring |
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED` | No | Set `true` to test analytics locally |

Never commit `.env.local` or expose `STELLAR_SECRET_KEY` / `GITHUB_SECRET` in client code.

## Architecture

flowm runs a 3-agent pipeline:

| Agent | Responsibility | Side effects |
|---|---|---|
| **Interpreter** | Validates natural language and builds a `TaskPlan` | None |
| **Fetcher** | Reads GitHub notifications | Read-only |
| **Actor** | Summarizes results and logs to Soroban | Writes on-chain audit logs |

**Stellar signing choice:** `log_action` is submitted with a server-funded testnet account (`STELLAR_SECRET_KEY`), not Freighter. This avoids wallet popups during automated runs and is more reliable for API-driven execution. Freighter is still required in the UI so users connect a Stellar identity; audit log reads use Soroban RPC (`get_action_count`, `get_actions`) without wallet interaction.

## Smart Contract

flowm logs every agent action to a Soroban contract on **Stellar Testnet**. The contract is append-only: each action gets a unique sequential id and is stored in persistent ledger storage.

| Field | Value |
|---|---|
| **Contract address** | `CD3JPZA3CQUX6NZMXK4BPA5MQ4WLWA5NI32KWFPQXSAMGYIDWJILPAVC` |
| **Network** | Stellar Testnet (`Test SDF Network ; September 2015`) |
| **Deployer account** | `GC6PYSBZWG5IYY3JBKWJRUK2R5R2QKKXFMJSQ47RPH5Y6HL3BCGSK6DS` |
| **Deployment tx** | [7eb1ed872d91777ba6d21e28ec7227911ef8dd20437e18d1418322643f2c9354](https://stellar.expert/explorer/testnet/tx/7eb1ed872d91777ba6d21e28ec7227911ef8dd20437e18d1418322643f2c9354) |
| **WASM upload tx** | [8e1bcba2b2da1a9f8083628022bdaf4b3cf8bd24065e27a2ba916b083d3a1471](https://stellar.expert/explorer/testnet/tx/8e1bcba2b2da1a9f8083628022bdaf4b3cf8bd24065e27a2ba916b083d3a1471) |
| **RPC URL** | `https://soroban-testnet.stellar.org` |

### Functions

- `log_action(agent_id, action_type, tool, instruction_hash, timestamp) -> u64` — append one immutable log entry
- `get_action(id) -> ActionLog` — read a single entry
- `get_action_count() -> u64` — total entries
- `get_actions(start, limit) -> Vec<ActionLog>` — paginated audit trail (max 100 per call)

Build and deploy steps are documented in [`contracts/README.md`](contracts/README.md).

## User feedback

Users can submit feedback via:

- **After a successful instruction** — thumbs up/down with optional short note
- **Header / footer** — **Send feedback** opens a modal

Submissions are stored in two places:

1. **Vercel Runtime Logs** — full JSON payload tagged `[flowm:feedback]` (view in Vercel → Project → Logs)
2. **Vercel Analytics** — `feedback_submitted` event with `rating`, `source`, and truncated comment (max 200 chars)

No GitHub tokens, wallet keys, or instruction text are included in feedback payloads by default.

## Monitoring & Analytics

flowm uses lightweight, privacy-conscious monitoring so you can tell whether real users are getting value — without shipping secrets to third parties.

### What is tracked

| Signal | Tool | Data sent |
|---|---|---|
| Page views | [Vercel Web Analytics](https://vercel.com/docs/analytics) | Route visits (automatic) |
| Wallet connected | Vercel custom event | `is_testnet` only |
| GitHub authenticated | Vercel custom event | Event name only (once per browser session) |
| Instruction submitted / succeeded / failed | Vercel custom event | Failed events include `step` only |
| Audit trail viewed | Vercel custom event | Event name only |
| Feedback submitted | Vercel custom event + server logs | Rating, source, optional truncated comment |
| Pipeline & UI errors | [Sentry](https://sentry.io) | Agent step, HTTP status, error message — **no** tokens or keys |

**Never sent to analytics or Sentry:** GitHub access tokens, instruction text, notification summaries, wallet public keys, private keys, or server signing secrets. Scrubbing runs in `lib/monitoring/scrub.ts`.

### Setup

1. **Vercel Analytics** — Enable **Web Analytics** on your Vercel project. Custom events appear under the Events tab.
2. **Sentry** — Create a Next.js project and set `NEXT_PUBLIC_SENTRY_DSN` in Vercel env vars.

## Screenshots

<!-- Add screenshots after deploy -->
