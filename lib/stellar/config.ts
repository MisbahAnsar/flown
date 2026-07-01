import type { StellarPublicConfig } from "./types";

export function getStellarConfig(): import("./types").StellarConfig | null {
  const publicConfig = getStellarPublicConfig();
  const secretKey = process.env.STELLAR_SECRET_KEY;

  if (!publicConfig || !secretKey) {
    return null;
  }

  return {
    ...publicConfig,
    secretKey,
  };
}

export function getStellarPublicConfig(): StellarPublicConfig | null {
  const networkPassphrase = process.env.STELLAR_NETWORK_PASSPHRASE;
  const rpcUrl = process.env.STELLAR_RPC_URL;
  const contractId = process.env.STELLAR_CONTRACT_ID;

  if (!networkPassphrase || !rpcUrl || !contractId) {
    return null;
  }

  return {
    networkPassphrase,
    rpcUrl,
    contractId,
  };
}
