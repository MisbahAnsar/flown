import {
  buildFeedbackTemplateParams,
  type FeedbackEmailInput,
} from "./format-email";

export interface EmailJsConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  privateKey: string;
}

export function getEmailJsConfig(): EmailJsConfig | null {
  const serviceId = process.env.EMAILJS_SERVICE_ID?.trim();
  const templateId = process.env.EMAILJS_TEMPLATE_ID?.trim();
  const publicKey = process.env.EMAILJS_PUBLIC_KEY?.trim();
  const privateKey = process.env.EMAILJS_PRIVATE_KEY?.trim();

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    return null;
  }

  return { serviceId, templateId, publicKey, privateKey };
}

export function isEmailJsConfigured(): boolean {
  return getEmailJsConfig() !== null;
}

export async function sendFeedbackEmail(
  input: FeedbackEmailInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = getEmailJsConfig();
  if (!config) {
    return { ok: false, error: "EmailJS is not configured on the server." };
  }

  let response: Response;

  try {
    response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: config.serviceId,
        template_id: config.templateId,
        user_id: config.publicKey,
        accessToken: config.privateKey,
        template_params: buildFeedbackTemplateParams(input),
      }),
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach EmailJS. Check your network and try again.",
    };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return {
      ok: false,
      error: body.trim() || `EmailJS request failed (${response.status}).`,
    };
  }

  return { ok: true };
}
