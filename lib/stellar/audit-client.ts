import type { AuditTrailResponse } from "@/lib/stellar/audit-trail";

export async function fetchAuditTrail(
  start: number,
  limit: number,
): Promise<
  | { ok: true; data: AuditTrailResponse }
  | { ok: false; error: string }
> {
  const params = new URLSearchParams({
    start: String(start),
    limit: String(limit),
  });

  const response = await fetch(`/api/audit-trail?${params.toString()}`);
  const data = (await response.json()) as AuditTrailResponse | { error: string };

  if (!response.ok) {
    return {
      ok: false,
      error: "error" in data ? data.error : "Failed to load audit trail.",
    };
  }

  return { ok: true, data: data as AuditTrailResponse };
}
