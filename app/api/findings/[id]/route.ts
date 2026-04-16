import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet, updateRowById } from "@/lib/sheets";
import { nowIso } from "@/lib/dates";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission("responses", "create");
    const { id } = await params;
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const body = await req.json();

    const findings = await readSheet(workbookId, "FINDINGS");
    const finding = findings.find((f) => String(f.finding_id) === String(id));

    if (!finding) {
      return NextResponse.json(
        { ok: false, message: "Finding not found" },
        { status: 404 }
      );
    }

    const mode = String(body.mode || "plan");

    if (mode === "close") {
      await updateRowById(workbookId, "FINDINGS", "finding_id", String(id), {
        corrective_action: body.corrective_action || "",
        responsible_party: body.responsible_party || "",
        target_close_date: body.target_close_date || "",
        verification_notes: body.verification_notes || "",
        actual_close_date:
          body.actual_close_date || new Date().toISOString().slice(0, 10),
        compliance_status: "closed",
        closure_status: "closed",
        closed_by: user.appUserId,
        closed_at: nowIso(),
        updated_at: nowIso(),
      });
    } else {
      await updateRowById(workbookId, "FINDINGS", "finding_id", String(id), {
        corrective_action: body.corrective_action || "",
        responsible_party: body.responsible_party || "",
        target_close_date: body.target_close_date || "",
        verification_notes: body.verification_notes || "",
        updated_at: nowIso(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to update finding" },
      { status: 400 }
    );
  }
}
