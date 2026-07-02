import { describe, expect, test } from "bun:test";
import {
  buildFeedbackMessage,
  buildFeedbackTemplateParams,
} from "./format-email";

describe("buildFeedbackMessage", () => {
  test("returns only the user comment", () => {
    expect(buildFeedbackMessage("loved the product")).toBe("loved the product");
    expect(buildFeedbackMessage("   ")).toBe("(no comment)");
    expect(buildFeedbackMessage(null)).toBe("(no comment)");
  });
});

describe("buildFeedbackTemplateParams", () => {
  test("maps variables for the EmailJS website template", () => {
    const params = buildFeedbackTemplateParams({
      rating: "up",
      comment: "loved the product",
      source: "modal",
      walletAddress: "GDPO3BCREMTXRJYBX3M4JU6R7MJN4XLKY4O5S5BJBCV7DXSP6HPEDSUY",
    });

    expect(params.message).toBe("loved the product");
    expect(params.rating_label).toBe("Helpful");
    expect(params.source).toBe("Feedback form");
    expect(params.wallet_address).toBe(
      "GDPO3BCREMTXRJYBX3M4JU6R7MJN4XLKY4O5S5BJBCV7DXSP6HPEDSUY",
    );
    expect(params.name).toBe("flowms user");
  });
});
