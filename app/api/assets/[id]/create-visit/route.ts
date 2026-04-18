import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { appendRow, readSheet } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requirePermission("visits", "create");
    const { id } = await params;
    const workbookId = actor.workbookId;

    if (String(actor.role || "").toLowerCase() === "inspector") {
      return NextResponse.json(
        {
          ok: false,
          message: "المفتش لا ينشئ زيارة جديدة من الأصل",
        },
        { status: 403 }
      );
    }

    const [assets, visits, visitSystems] = await Promise.all([
      readSheet(workbookId, "ASSETS"),
      readSheet(workbookId, "VISITS"),
      readSheet(workbookId, "VISIT_SYSTEMS"),
    ]);

    const asset = assets.find(
      (row: any) => String(row.asset_id || "") === String(id)
    );

    if (!asset) {
      return NextResponse.json(
        { ok: false, message: "Asset not found" },
        { status: 404 }
      );
    }

    const relatedVisitSystems = visitSystems.filter(
      (row: any) =>
        String(row.building_system_id || "") ===
        String(asset.building_system_id || "")
    );

    const relatedVisitIds = new Set(
      relatedVisitSystems.map((row: any) => String(row.visit_id || ""))
    );

    const existingOpenVisit = visits.find((visit: any) => {
      if (!relatedVisitIds.has(String(visit.visit_id || ""))) return false;

      const status = String(visit.visit_status || "").toLowerCase();
      return status !== "closed" && status !== "completed";
    });

    if (existingOpenVisit) {
      return NextResponse.json({
        ok: true,
        reused: true,
        visit_id: String(existingOpenVisit.visit_id || ""),
      });
    }

    const timestamp = nowIso();
    const today = new Date().toISOString().slice(0, 10);

    const visitId = makeId("VIS");
    const visitSystemId = makeId("VST");

    await appendRow(workbookId, "VISITS", {
      visit_id: visitId,
      facility_id: String(asset.facility_id || ""),
      building_id: String(asset.building_id || ""),
      assigned_inspector_id: "",
      visit_type: "asset_followup",
      planned_date: today,
      visit_date: "",
      visit_status: "planned",
      summary_result: "pending",
      notes: `زيارة تم إنشاؤها من الأصل ${String(
        asset.asset_name_ar || asset.asset_name || asset.asset_code || asset.asset_id
      )}`,
      next_due_date: String(asset.next_due_date || ""),
      created_at: timestamp,
      updated_at: timestamp,
    });

    await appendRow(workbookId, "VISIT_SYSTEMS", {
      visit_system_id: visitSystemId,
      visit_id: visitId,
      building_system_id: String(asset.building_system_id || ""),
      system_code: String(asset.system_code || ""),
      actual_start_time: "",
      actual_end_time: "",
      result_summary: "pending",
      compliance_percent: "",
      critical_count: 0,
      major_count: 0,
      minor_count: 0,
      next_due_date: String(asset.next_due_date || ""),
      status: "planned",
      created_at: timestamp,
      updated_at: timestamp,
    });

    return NextResponse.json({
      ok: true,
      visit_id: visitId,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error.message || "Failed to create visit from asset",
      },
      { status: 400 }
    );
  }
}
