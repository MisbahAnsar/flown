# Contributing to flowms

Thank you for reviewing or contributing to flowms. This document explains how the repository is organized so you can navigate the codebase quickly.

## Project structure

```
flowms/
├── app/                      # Next.js App Router
│   ├── api/                  # Server routes (pipeline, auth, audit trail, feedback)
│   ├── layout.tsx            # Root layout, metadata, providers
│   └── page.tsx              # Home page (Chat + Audit Trail shell)
├── components/               # React UI
│   ├── audit/                # On-chain audit trail panel
│   ├── auth/                 # GitHub OAuth button
│   ├── feedback/             # User feedback modal and post-success prompts
│   ├── instruction/          # Activity feed, run history, summary display
│   ├── monitoring/           # Analytics shell
│   ├── onboarding/           # First-visit getting-started banner
│   ├── ui/                   # Shared UI primitives (toast)
│   └── wallet/               # Freighter connect/disconnect
├── contracts/                # Soroban smart contract (Rust)
│   └── src/lib.rs            # log_action, get_actions, etc.
├── lib/
│   ├── agents/               # Interpreter, Fetcher, Actor pipeline agents
│   ├── feedback/             # Feedback API client and types
│   ├── github/               # GitHub notifications client
│   ├── monitoring/           # Vercel Analytics + Sentry helpers
│   ├── pipeline/             # run-instruction orchestration and API types
│   └── stellar/              # Soroban contract client, audit trail reads
└── types/                    # NextAuth type extensions
```

## Key modules

| Path | Role |
|---|---|
| `lib/agents/interpreter.ts` | Validates natural language → `TaskPlan` |
| `lib/agents/fetcher.ts` | Reads GitHub notifications (read-only) |
| `lib/agents/actor.ts` | Summarizes results and calls Soroban `log_action` |
| `lib/pipeline/run-instruction.ts` | Orchestrates interpret → fetch → act |
| `app/api/run-instruction/route.ts` | Authenticated HTTP entry point for the pipeline |
| `lib/stellar/audit-trail.ts` | Paginated on-chain history via `get_actions` |
| `contracts/src/lib.rs` | Append-only Soroban audit log contract |

## Development workflow

```bash
bun install
cp .env.local.example .env.local   # fill in values
bun dev                            # http://localhost:3000
bun test lib                       # unit tests
bun run build                      # production build
cd contracts && cargo test         # contract unit tests
```

## Pull requests

- Keep changes focused and match existing TypeScript / Tailwind conventions.
- Run `bun test lib` and `bun run build` before submitting.
- Do not commit `.env.local`, secrets, or real signing keys.
- Update `README.md` if you change setup, env vars, or architecture.

## Security

- GitHub access tokens live in the NextAuth JWT only (server-side).
- `STELLAR_SECRET_KEY` is server-only and used for Soroban writes.
- Freighter provides the user's public key in the UI; private keys never touch the app.

Questions? Open an issue or refer to the main [README.md](./README.md).
