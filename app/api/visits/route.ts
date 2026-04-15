import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { appendRow, readSheet } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";

export async function GET() {
  try {
    const user = await requirePermission("visits", "view");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const visits = await readSheet(workbookId, "VISITS");
    return NextResponse.json({ ok: true, data: visits });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("visits", "create");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const body = await req.json();
    const visitId = makeId("VIS");

    await appendRow(workbookId, "VISITS", {
      visit_id: visitId,
      facility_id: body.facility_id,
      building_id: body.building_id,
      visit_type: body.visit_type,
      visit_date: "",
      planned_date: body.planned_date,
      due_date: body.due_date,
      next_due_date: "",
      assigned_inspector_id: body.assigned_inspector_id,
      assigned_system_scope: body.system_codes.join("|"),
      visit_status: "planned",
      summary_result: "pending",
      notes: body.notes || "",
      created_at: nowIso(),
      updated_at: nowIso()
    });

    for (const system of body.systems) {
      await appendRow(workbookId, "VISIT_SYSTEMS", {
        visit_system_id: makeId("VSYS"),
        visit_id: visitId,
        building_system_id: system.building_system_id,
        system_code: system.system_code,
        checklist_version: "active",
        planned_start_time: "",
        planned_end_time: "",
        actual_start_time: "",
        actual_end_time: "",
        result_summary: "pending",
        compliance_percent: 0,
        critical_count: 0,
        major_count: 0,
        minor_count: 0,
        next_due_date: "",
        status: "planned",
        notes: "",
        created_at: nowIso(),
        updated_at: nowIso()
      });
    }

    return NextResponse.json({ ok: true, visitId });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }
}
