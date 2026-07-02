import { afterEach, describe, expect, test } from "bun:test";
import { getEmailJsConfig, sendFeedbackEmail } from "./emailjs";

describe("getEmailJsConfig", () => {
  afterEach(() => {
    delete process.env.EMAILJS_SERVICE_ID;
    delete process.env.EMAILJS_TEMPLATE_ID;
    delete process.env.EMAILJS_PUBLIC_KEY;
    delete process.env.EMAILJS_PRIVATE_KEY;
  });

  test("returns null when EmailJS env vars are missing", () => {
    expect(getEmailJsConfig()).toBeNull();
  });

  test("returns config when all EmailJS env vars are set", () => {
    process.env.EMAILJS_SERVICE_ID = "service_test";
    process.env.EMAILJS_TEMPLATE_ID = "template_test";
    process.env.EMAILJS_PUBLIC_KEY = "public_test";
    process.env.EMAILJS_PRIVATE_KEY = "private_test";

    expect(getEmailJsConfig()).toEqual({
      serviceId: "service_test",
      templateId: "template_test",
      publicKey: "public_test",
      privateKey: "private_test",
    });
  });
});

describe("sendFeedbackEmail", () => {
  afterEach(() => {
    delete process.env.EMAILJS_SERVICE_ID;
    delete process.env.EMAILJS_TEMPLATE_ID;
    delete process.env.EMAILJS_PUBLIC_KEY;
    delete process.env.EMAILJS_PRIVATE_KEY;
  });

  test("returns error when EmailJS is not configured", async () => {
    const result = await sendFeedbackEmail({
      rating: "up",
      comment: "Great app",
      source: "modal",
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.error).toContain("not configured");
  });
});
