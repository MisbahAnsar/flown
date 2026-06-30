#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, BytesN, Env, Symbol, Vec,
};

/// Maximum number of entries returned per `get_actions` call.
/// Keeps pagination loops bounded and predictable for callers.
const MAX_PAGE_SIZE: u32 = 100;

/// Ledgers to add when extending persistent entry TTL after a write.
const PERSISTENT_EXTEND_TO: u32 = 5_256_000; // ~30 days at 5s/ledger

/// Extend TTL only when remaining lifetime falls below this threshold.
const PERSISTENT_THRESHOLD: u32 = 518_400; // ~3 days at 5s/ledger

#[contract]
pub struct ActionLogContract;

/// Immutable record of a single agent action written to the ledger.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ActionLog {
    pub agent_id: Symbol,
    pub action_type: Symbol,
    pub tool: Symbol,
    pub instruction_hash: BytesN<32>,
    /// Caller-supplied timestamp (e.g. Unix seconds from the off-chain pipeline).
    pub timestamp: u64,
    /// Soroban ledger timestamp when the entry was stored.
    pub logged_at: u64,
}

/// Persistent storage keys. Each action is stored under its own key so history
/// is never overwritten.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Action(u64),
}

/// Small, frequently read values kept in instance storage.
#[contracttype]
#[derive(Clone)]
pub enum InstanceKey {
    ActionCount,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
  /// No action exists at the requested id.
  ActionNotFound = 1,
  /// `limit` must be between 1 and `MAX_PAGE_SIZE`.
  InvalidLimit = 2,
  /// `start` is greater than the total action count.
  InvalidStart = 3,
  /// `timestamp` must be greater than zero.
  InvalidTimestamp = 4,
}

#[contractimpl]
impl ActionLogContract {
    /// Append a new action to the immutable log.
    ///
    /// Assigns the next sequential id, stores the entry in persistent storage,
    /// and returns that id. Entries are never updated or deleted.
    ///
    /// Symbol arguments are validated by the Soroban host (1-32 chars, `[a-zA-Z0-9_]`).
    pub fn log_action(
        env: Env,
        agent_id: Symbol,
        action_type: Symbol,
        tool: Symbol,
        instruction_hash: BytesN<32>,
        timestamp: u64,
    ) -> Result<u64, Error> {
        if timestamp == 0 {
            return Err(Error::InvalidTimestamp);
        }

        let id = next_action_id(&env);
        let logged_at = env.ledger().timestamp();

        let entry = ActionLog {
            agent_id,
            action_type,
            tool,
            instruction_hash,
            timestamp,
            logged_at,
        };

        let key = DataKey::Action(id);
        env.storage().persistent().set(&key, &entry);
        extend_persistent_ttl(&env, &key);

        Ok(id)
    }

    /// Fetch a single log entry by its sequential id.
    pub fn get_action(env: Env, id: u64) -> Result<ActionLog, Error> {
        let count = Self::get_action_count(env.clone());
        if id >= count {
            return Err(Error::ActionNotFound);
        }

        let key = DataKey::Action(id);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(Error::ActionNotFound)
    }

    /// Return the total number of logged actions.
    pub fn get_action_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&InstanceKey::ActionCount)
            .unwrap_or(0)
    }

    /// Return a page of log entries starting at `start`, up to `limit` items.
    ///
    /// Used by the frontend audit trail. The loop is bounded by `limit`, which
    /// is capped at `MAX_PAGE_SIZE`.
    pub fn get_actions(env: Env, start: u64, limit: u32) -> Result<Vec<ActionLog>, Error> {
        if limit == 0 || limit > MAX_PAGE_SIZE {
            return Err(Error::InvalidLimit);
        }

        let count = Self::get_action_count(env.clone());
        if start > count {
            return Err(Error::InvalidStart);
        }

        let mut results = Vec::new(&env);
        let mut index = start;
        let mut remaining = limit;

        while remaining > 0 && index < count {
            let key = DataKey::Action(index);
            let entry: ActionLog = env
                .storage()
                .persistent()
                .get(&key)
                .ok_or(Error::ActionNotFound)?;
            results.push_back(entry);
            index += 1;
            remaining -= 1;
        }

        Ok(results)
    }
}

/// Read the current count and advance it atomically via instance storage.
fn next_action_id(env: &Env) -> u64 {
    let key = InstanceKey::ActionCount;
    let id: u64 = env.storage().instance().get(&key).unwrap_or(0);
    env.storage().instance().set(&key, &(id + 1));
    id
}

fn extend_persistent_ttl(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_THRESHOLD, PERSISTENT_EXTEND_TO);
}

#[cfg(test)]
mod test;
