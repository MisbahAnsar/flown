# flowm-action-log (Soroban)

Append-only audit log contract for the flowm agent pipeline. Each Interpreter, Fetcher, and Actor step is stored as an immutable `ActionLog` entry on Stellar.

## Prerequisites

- [Rust](https://rustup.rs/) (1.84+)
- `wasm32v1-none` target: `rustup target add wasm32v1-none`
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli): `cargo install --locked stellar-cli`

## Build

From this directory:

```bash
stellar contract build
```

Release WASM output:

```
target/wasm32v1-none/release/flowm_action_log.wasm
```

Run unit tests locally (no network required):

```bash
cargo test
```

## Configure testnet (one-time)

```powershell
stellar network add testnet `
  --rpc-url https://soroban-testnet.stellar.org `
  --network-passphrase "Test SDF Network ; September 2015"
```

If `testnet` already exists in your config, skip this step.

## Create a funded deployer identity (one-time)

```bash
stellar keys generate flowm-deployer --network testnet --fund
```

Show the deployer public key:

```bash
stellar keys address flowm-deployer
```

## Deploy to testnet

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/flowm_action_log.wasm \
  --source-account flowm-deployer \
  --network testnet \
  --alias flowm-action-log
```

The CLI prints the contract ID and Stellar Expert links for each transaction.

## Verify deployment

Confirm the log is empty:

```bash
stellar contract invoke \
  --id CD3JPZA3CQUX6NZMXK4BPA5MQ4WLWA5NI32KWFPQXSAMGYIDWJILPAVC \
  --source-account flowm-deployer \
  --network testnet \
  -- get_action_count
```

Expected output: `0`

## Mainnet checklist

When moving to mainnet later:

1. Build with `stellar contract build` (same release profile).
2. Add a `mainnet` network entry with your production RPC URL and passphrase `Public Global Stellar Network ; September 2015`.
3. Fund a dedicated deployer account on mainnet (no Friendbot).
4. Deploy with `--network mainnet` and a new alias (e.g. `flowm-action-log-mainnet`).
5. Update `STELLAR_CONTRACT_ID`, `STELLAR_RPC_URL`, and `STELLAR_NETWORK_PASSPHRASE` in the app `.env.local`.

## Contract API

| Function | Description |
|---|---|
| `log_action(agent_id, action_type, tool, instruction_hash, timestamp) -> u64` | Append one entry; returns sequential id |
| `get_action(id) -> ActionLog` | Fetch a single entry by id |
| `get_action_count() -> u64` | Total entries logged |
| `get_actions(start, limit) -> Vec<ActionLog>` | Paginated audit trail (limit capped at 100) |

`ActionLog` fields: `agent_id`, `action_type`, `tool`, `instruction_hash`, `timestamp`, `logged_at`.
