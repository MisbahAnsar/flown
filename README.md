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
6. Run the dev server: `bun dev`
7. Open [http://localhost:3000](http://localhost:3000), click **Sign in with GitHub**, then **Connect Wallet**. Both are required before running an instruction.

## Architecture

<!-- To be filled in -->

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

## Live Demo

<!-- To be filled in -->

## Screenshots

<!-- To be filled in -->
