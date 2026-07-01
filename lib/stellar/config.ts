import type { StellarConfig } from "./types";

export function getStellarConfig(): StellarConfig | null {
  const networkPassphrase = process.env.STELLAR_NETWORK_PASSPHRASE;
  const rpcUrl = process.env.STELLAR_RPC_URL;
  const contractId = process.env.STELLAR_CONTRACT_ID;
  const secretKey = process.env.STELLAR_SECRET_KEY;

  if (!networkPassphrase || !rpcUrl || !contractId || !secretKey) {
    return null;
  }

  return {
    networkPassphrase,
    rpcUrl,
    contractId,
    secretKey,
  };
}
