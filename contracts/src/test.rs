#![cfg(test)]

use super::{ActionLogContract, ActionLogContractClient, Error};
use soroban_sdk::{symbol_short, testutils::Ledger as _, BytesN, Env};

fn sample_hash(env: &Env, seed: u8) -> BytesN<32> {
    let mut bytes = [0u8; 32];
    bytes[0] = seed;
    BytesN::from_array(env, &bytes)
}

fn log_sample_action(
    client: &ActionLogContractClient,
    env: &Env,
    seed: u8,
    timestamp: u64,
) -> u64 {
    client.log_action(
        &symbol_short!("interp"),
        &symbol_short!("interpret"),
        &symbol_short!("github"),
        &sample_hash(env, seed),
        &timestamp,
    )
}

#[test]
fn logs_action_and_returns_sequential_id() {
    let env = Env::default();
    let contract_id = env.register(ActionLogContract, ());
    let client = ActionLogContractClient::new(&env, &contract_id);

    let id = log_sample_action(&client, &env, 1, 1_700_000_000);
    assert_eq!(id, 0);
    assert_eq!(client.get_action_count(), 1);
}

#[test]
fn retrieves_action_by_id() {
    let env = Env::default();
    env.ledger().with_mut(|li| {
        li.timestamp = 1_700_000_500;
    });
    let contract_id = env.register(ActionLogContract, ());
    let client = ActionLogContractClient::new(&env, &contract_id);

    let hash = sample_hash(&env, 42);
    let id = client.log_action(
        &symbol_short!("fetcher"),
        &symbol_short!("fetch"),
        &symbol_short!("github"),
        &hash,
        &1_700_000_001,
    );

    let entry = client.get_action(&id);
    assert_eq!(entry.agent_id, symbol_short!("fetcher"));
    assert_eq!(entry.action_type, symbol_short!("fetch"));
    assert_eq!(entry.tool, symbol_short!("github"));
    assert_eq!(entry.instruction_hash, hash);
    assert_eq!(entry.timestamp, 1_700_000_001);
    assert_eq!(entry.logged_at, 1_700_000_500);
}

#[test]
fn action_count_increments_correctly() {
    let env = Env::default();
    let contract_id = env.register(ActionLogContract, ());
    let client = ActionLogContractClient::new(&env, &contract_id);

    assert_eq!(client.get_action_count(), 0);

    let id0 = log_sample_action(&client, &env, 1, 1_700_000_000);
    let id1 = log_sample_action(&client, &env, 2, 1_700_000_100);
    let id2 = log_sample_action(&client, &env, 3, 1_700_000_200);

    assert_eq!(id0, 0);
    assert_eq!(id1, 1);
    assert_eq!(id2, 2);
    assert_eq!(client.get_action_count(), 3);
}

#[test]
fn paginates_actions() {
    let env = Env::default();
    let contract_id = env.register(ActionLogContract, ());
    let client = ActionLogContractClient::new(&env, &contract_id);

    for seed in 1..=5 {
        log_sample_action(&client, &env, seed, 1_700_000_000 + seed as u64);
    }

    let page = client.get_actions(&1, &2);
    assert_eq!(page.len(), 2);
    assert_eq!(page.get(0).unwrap().timestamp, 1_700_000_002);
    assert_eq!(page.get(1).unwrap().timestamp, 1_700_000_003);

    let tail = client.get_actions(&4, &10);
    assert_eq!(tail.len(), 1);
    assert_eq!(tail.get(0).unwrap().timestamp, 1_700_000_005);
}

#[test]
fn rejects_missing_action() {
    let env = Env::default();
    let contract_id = env.register(ActionLogContract, ());
    let client = ActionLogContractClient::new(&env, &contract_id);

    let result = client.try_get_action(&99);
    assert_eq!(result, Err(Ok(Error::ActionNotFound)));
}

#[test]
fn rejects_invalid_pagination() {
    let env = Env::default();
    let contract_id = env.register(ActionLogContract, ());
    let client = ActionLogContractClient::new(&env, &contract_id);

    log_sample_action(&client, &env, 1, 1_700_000_000);

    assert_eq!(
        client.try_get_actions(&0, &0),
        Err(Ok(Error::InvalidLimit))
    );
    assert_eq!(
        client.try_get_actions(&5, &1),
        Err(Ok(Error::InvalidStart))
    );
}
