import { NextResponse } from "next/server";
import { captureMonitoringException } from "@/lib/monitoring/sentry";
import {
  AuditTrailQuerySchema,
  fetchAuditTrailPage,
} from "@/lib/stellar/audit-trail";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = AuditTrailQuerySchema.safeParse({
    start: searchParams.get("start") ?? "0",
    limit: searchParams.get("limit") ?? "10",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid query parameters." },
      { status: 400 },
    );
  }

  try {
    const result = await fetchAuditTrailPage(
      parsed.data.start,
      parsed.data.limit,
    );

    if (!result.success) {
      captureMonitoringException(new Error(result.error), {
        route: "/api/audit-trail",
        surface: "audit_trail_rpc",
      });
      return NextResponse.json({ error: result.error }, { status: 503 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    captureMonitoringException(error, { route: "/api/audit-trail" });
    return NextResponse.json(
      { error: "Failed to load audit trail." },
      { status: 500 },
    );
  }
}
