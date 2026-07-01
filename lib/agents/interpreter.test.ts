import { describe, expect, test } from "bun:test";
import {
  interpret,
  SUPPORTED_INSTRUCTION_EXAMPLE,
} from "./interpreter";

describe("interpret", () => {
  test("accepts a valid matching instruction", () => {
    const result = interpret("Summarize my GitHub notifications from this week");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.plan.intent).toBe("summarize_github_notifications");
    expect(result.plan.tool).toBe("github");
    expect(result.plan.outputFormat).toBe("summary");
    expect(result.plan.instructionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(Number.isNaN(Date.parse(result.plan.createdAt))).toBe(false);
  });

  test("accepts keyword variants for the supported intent", () => {
    const result = interpret("check my github notification inbox");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.plan.intent).toBe("summarize_github_notifications");
  });

  test("rejects a non-matching instruction with guidance", () => {
    const result = interpret("Send a Slack message to my team");

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error).toContain("Only one instruction type is supported");
    expect(result.error).toContain(SUPPORTED_INSTRUCTION_EXAMPLE);
  });

  test("rejects empty input", () => {
    const result = interpret("   ");

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error).toContain("empty");
    expect(result.error).toContain(SUPPORTED_INSTRUCTION_EXAMPLE);
  });
});
