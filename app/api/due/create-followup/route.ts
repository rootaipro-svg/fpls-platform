import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { appendRow, readSheet } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("visits", "create");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const body = await req.json();

    const buildingSystemId = String(body.building_system_id || "");
    const plannedDate =
      String(body.planned_date || "") || new Date().toISOString().slice(0, 10);

    if (!buildingSystemId) {
      return NextResponse.json(
        { ok: false, message: "building_system_id is required" },
        { status: 400 }
      );
    }

    const [visitSystems, visits] = await Promise.all([
      readSheet(workbookId, "VISIT_SYSTEMS"),
      readSheet(workbookId, "VISITS"),
    ]);

    const sourceVisitSystem = visitSystems.find(
      (vs) => String(vs.building_system_id) === buildingSystemId
    );

    if (!sourceVisitSystem) {
      return NextResponse.json(
        { ok: false, message: "Building system not found" },
        { status: 404 }
      );
    }

    const sourceVisit = visits.find(
      (v) => String(v.visit_id) === String(sourceVisitSystem.visit_id || "")
    );

    const visitId = makeId("VIS");
    const visitSystemId = makeId("VSY");

    await appendRow(workbookId, "VISITS", {
      visit_id: visitId,
      tenant_id: user.tenantId,
      facility_id: sourceVisit?.facility_id || "",
      building_id: sourceVisit?.building_id || "",
      visit_type: "followup",
      visit_status: "planned",
      planned_date: plannedDate,
      due_date: plannedDate,
      visit_date: "",
      summary_result: "pending",
      assigned_inspector_id: "",
      primary_visit_system_id: visitSystemId,
      notes: "Created from due item",
      next_due_date: "",
      created_at: nowIso(),
      updated_at: nowIso(),
    });

    await appendRow(workbookId, "VISIT_SYSTEMS", {
      visit_system_id: visitSystemId,
      visit_id: visitId,
      building_system_id: sourceVisitSystem.building_system_id,
      system_code: sourceVisitSystem.system_code || "",
      planned_start_time: "",
      planned_end_time: "",
      actual_start_time: "",
      actual_end_time: "",
      result_summary: "pending",
      compliance_percent: "",
      critical_count: 0,
      major_count: 0,
      minor_count: 0,
      next_due_date: "",
      status: "planned",
      created_at: nowIso(),
      updated_at: nowIso(),
    });

    return NextResponse.json({
      ok: true,
      visit_id: visitId,
      visit_system_id: visitSystemId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to create follow-up visit" },
      { status: 400 }
    );
  }
}
