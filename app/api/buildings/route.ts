import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { appendRow } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("buildings", "create");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const body = await req.json();
    await appendRow(workbookId, "BUILDINGS", {
      building_id: makeId("BLD"),
      facility_id: body.facility_id,
      building_code: body.building_code,
      building_name: body.building_name,
      building_name_ar: body.building_name_ar || "",
      building_use: body.building_use,
      construction_type: body.construction_type || "",
      number_of_floors: body.number_of_floors || 1,
      basement_count: body.basement_count || 0,
      building_height_m: body.building_height_m || "",
      area_m2: body.area_m2 || "",
      occupancy_profile_id: body.occupancy_profile_id,
      risk_profile_id: body.risk_profile_id,
      year_built: body.year_built || "",
      last_major_renovation_year: body.last_major_renovation_year || "",
      civil_defense_permit_no: body.civil_defense_permit_no || "",
      evacuation_strategy: body.evacuation_strategy || "",
      status: "active",
      notes: body.notes || "",
      created_at: nowIso(),
      updated_at: nowIso()
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }
}
