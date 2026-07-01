import { z } from "zod";
import { getStellarPublicConfig } from "@/lib/stellar/config";
import {
  createReadOnlyContractClient,
  formatLedgerTimestamp,
} from "@/lib/stellar/audit";

export const AuditTrailQuerySchema = z.object({
  start: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type AuditTrailAction = {
  id: number;
  agentId: string;
  actionType: string;
  tool: string;
  instructionHash: string;
  timestamp: string;
  loggedAt: string;
  timestampLabel: string;
  loggedAtLabel: string;
};

export type AuditTrailResponse = {
  contractId: string;
  totalCount: number;
  start: number;
  limit: number;
  actions: AuditTrailAction[];
};

export async function fetchAuditTrailPage(
  start: number,
  limit: number,
): Promise<
  | { success: true; data: AuditTrailResponse }
  | { success: false; error: string }
> {
  const config = getStellarPublicConfig();
  if (!config) {
    return {
      success: false,
      error: "Stellar public config is missing on the server.",
    };
  }

  const reader = createReadOnlyContractClient(config);
  const countResult = await reader.getActionCount();

  if (!countResult.success) {
    return {
      success: false,
      error: countResult.error.message,
    };
  }

  const totalCount = Number(countResult.data);

  if (totalCount === 0) {
    return {
      success: true,
      data: {
        contractId: config.contractId,
        totalCount: 0,
        start,
        limit,
        actions: [],
      },
    };
  }

  const actionsResult = await reader.getActions(BigInt(start), limit);

  if (!actionsResult.success) {
    return {
      success: false,
      error: actionsResult.error.message,
    };
  }

  const actions: AuditTrailAction[] = actionsResult.data.map((entry, index) => ({
    id: start + index,
    agentId: entry.agentId,
    actionType: entry.actionType,
    tool: entry.tool,
    instructionHash: entry.instructionHash,
    timestamp: entry.timestamp.toString(),
    loggedAt: entry.loggedAt.toString(),
    timestampLabel: formatLedgerTimestamp(entry.timestamp),
    loggedAtLabel: formatLedgerTimestamp(entry.loggedAt),
  }));

  return {
    success: true,
    data: {
      contractId: config.contractId,
      totalCount,
      start,
      limit,
      actions,
    },
  };
}
