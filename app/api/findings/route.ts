import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet, updateRowById } from "@/lib/sheets";
import { nowIso } from "@/lib/dates";

export async function GET() {
  try {
    const user = await requirePermission("findings", "view");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const findings = await readSheet(workbookId, "FINDINGS");
    return NextResponse.json({ ok: true, data: findings });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 403 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requirePermission("findings", "edit");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const body = await req.json();
    await updateRowById(workbookId, "FINDINGS", "finding_id", body.finding_id, {
      closure_status: body.closure_status,
      actual_close_date: body.actual_close_date || "",
      verification_notes: body.verification_notes || "",
      closed_by: body.closure_status === "closed" ? user.appUserId : "",
      closed_at: body.closure_status === "closed" ? nowIso() : "",
      updated_at: nowIso()
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }
}
