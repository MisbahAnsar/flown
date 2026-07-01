# flowm

flowm is a Next.js app where a user gives one natural language instruction (for example, "summarize my GitHub notifications") and a 3-agent pipeline (Interpreter, Fetcher, Actor) executes it, logging every action to a Soroban smart contract on Stellar testnet.

## Setup

1. Install dependencies: `bun install`
2. Copy `.env.local.example` to `.env.local` and fill in the values.
3. Create a **GitHub OAuth App** at [github.com/settings/developers](https://github.com/settings/developers):
   - **Application name**: `flowm` (or any local dev name)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
   - Copy the **Client ID** into `GITHUB_ID` and generate a **Client secret** for `GITHUB_SECRET`
   - flowm requests these scopes via NextAuth: `read:user`, `user:email`, `notifications`
4. Generate a NextAuth secret and add it to `.env.local`:
   ```bash
   openssl rand -base64 32
   ```
   Set the output as `NEXTAUTH_SECRET` and keep `NEXTAUTH_URL=http://localhost:3000`.
5. Install the [Freighter](https://www.freighter.app/) browser extension and switch it to **Testnet**.
6. Fund a dedicated testnet service account and set `STELLAR_SECRET_KEY` in `.env.local`. The Actor agent uses **server-side signing** with this key to submit `log_action` transactions reliably during pipeline runs. Freighter remains the user's connected wallet in the UI; Soroban logging is performed by the server account.
7. Run the dev server: `bun dev`
8. Open [http://localhost:3000](http://localhost:3000), click **Sign in with GitHub**, then **Connect Wallet**. Both are required before running an instruction.

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

Verified after deploy: `get_action_count` returns `0`.

### Functions

- `log_action(agent_id, action_type, tool, instruction_hash, timestamp) -> u64` — append one immutable log entry
- `get_action(id) -> ActionLog` — read a single entry
- `get_action_count() -> u64` — total entries
- `get_actions(start, limit) -> Vec<ActionLog>` — paginated audit trail (max 100 per call)

Build and deploy steps are documented in [`contracts/README.md`](contracts/README.md).

## Monitoring & Analytics

flowm uses lightweight, privacy-conscious monitoring so you can tell whether real users are getting value — without shipping secrets to third parties.

### What is tracked

| Signal | Tool | Data sent |
|---|---|---|
| Page views | [Vercel Web Analytics](https://vercel.com/docs/analytics) | Route visits (automatic) |
| Wallet connected | Vercel custom event | `is_testnet` only |
| GitHub authenticated | Vercel custom event | Event name only (once per browser session) |
| Instruction submitted / succeeded / failed | Vercel custom event | Failed events include `step` (`interpreter`, `fetcher`, `actor`, etc.) |
| Audit trail viewed | Vercel custom event | Event name only |
| Pipeline & UI errors | [Sentry](https://sentry.io) | Agent step, HTTP status, error message — **no** instruction text, GitHub tokens, wallet addresses, or `STELLAR_SECRET_KEY` |

**Never sent to analytics or Sentry:** GitHub access tokens, instruction text, notification summaries, wallet public keys, private keys, or server signing secrets. Scrubbing runs in `lib/monitoring/scrub.ts` before events leave the app.

### Setup

1. **Vercel Analytics** — On a Vercel deploy, open your project → **Analytics** → enable **Web Analytics**. Custom events appear under the Events tab after users interact with the app. To test locally, set `NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED=true` in `.env.local`.
2. **Sentry** — Create a Sentry project (Next.js). Copy the DSN into `NEXT_PUBLIC_SENTRY_DSN` in Vercel environment variables (and `.env.local` for local testing). View issues at [sentry.io](https://sentry.io) filtered by `pipeline_step` and `route` tags.

Sentry reports operational failures (`fetcher`, `actor`) and unexpected exceptions. Expected user mistakes (unsupported instructions, rate limits, auth) are counted in Vercel Analytics only, to keep error noise low.

## Live Demo

<!-- To be filled in -->

## Screenshots

<!-- To be filled in -->
