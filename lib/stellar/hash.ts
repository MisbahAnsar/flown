import { createHash } from "node:crypto";

export function hashInstruction(
  instructionId: string,
  intent: string,
): Buffer {
  return createHash("sha256")
    .update(`${instructionId}:${intent}`, "utf8")
    .digest();
}

export function hashInstructionHex(
  instructionId: string,
  intent: string,
): string {
  return hashInstruction(instructionId, intent).toString("hex");
}
