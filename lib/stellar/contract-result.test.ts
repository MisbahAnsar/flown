import { describe, expect, test } from "bun:test";
import {
  normalizeActionLogList,
  unwrapContractResult,
} from "./contract-result";

describe("unwrapContractResult", () => {
  test("unwraps Ok results with a value array", () => {
    const result = {
      isOk: () => true,
      isErr: () => false,
      unwrap: () => [{ agent_id: "actor" }],
      value: [{ agent_id: "actor" }],
    };

    expect(unwrapContractResult(result)).toEqual([{ agent_id: "actor" }]);
  });

  test("throws for Err results", () => {
    const result = {
      isOk: () => false,
      isErr: () => true,
      error: { message: "Invalid limit" },
    };

    expect(() => unwrapContractResult(result)).toThrow("Invalid limit");
  });
});

describe("normalizeActionLogList", () => {
  test("returns the inner array from Soroban Result<Vec<ActionLog>>", () => {
    const payload = {
      isOk: () => true,
      isErr: () => false,
      value: [{ agent_id: "actor", action_type: "summarize" }],
    };

    expect(normalizeActionLogList(payload)).toEqual([
      { agent_id: "actor", action_type: "summarize" },
    ]);
  });
});
