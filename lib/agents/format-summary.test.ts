import { describe, expect, test } from "bun:test";
import { sanitizeSummary } from "./format-summary";

describe("sanitizeSummary", () => {
  test("removes markdown headings and bold", () => {
    const input =
      "### What the Project Does\n\n**flowms** is a system that allows users — to run agents.";
    const output = sanitizeSummary(input);

    expect(output).not.toContain("###");
    expect(output).not.toContain("**");
    expect(output).toContain("flowms is a system");
    expect(output).not.toContain("—");
  });
});
