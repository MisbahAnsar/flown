export interface StellarConfig {
  networkPassphrase: string;
  rpcUrl: string;
  contractId: string;
}

export function getStellarConfig(): StellarConfig {
  return {
    networkPassphrase: process.env.STELLAR_NETWORK_PASSPHRASE ?? "",
    rpcUrl: process.env.STELLAR_RPC_URL ?? "",
    contractId: process.env.STELLAR_CONTRACT_ID ?? "",
  };
}

export async function logActionToContract(
  _action: string,
  _payload: Record<string, unknown>,
): Promise<string> {
  throw new Error("Not implemented");
}
