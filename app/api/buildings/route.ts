import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { appendRow } from "@/lib/sheets";

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("facilities", "view");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const body = await req.json();

    if (!String(body.facility_id || "").trim()) {
      throw new Error("facility_id is required");
    }

    if (!String(body.building_name || body.building_name_ar || "").trim()) {
      throw new Error("اسم المبنى مطلوب");
    }

    await appendRow(workbookId, "BUILDINGS", {
      building_id: makeId("BLD"),
      facility_id: String(body.facility_id || ""),
      building_code: String(body.building_code || ""),
      building_name: String(body.building_name || ""),
      building_name_ar: String(body.building_name_ar || ""),
      building_use: String(body.building_use || ""),
      construction_type: String(body.construction_type || ""),
      number_of_floors: String(body.number_of_floors || ""),
      basement_count: String(body.basement_count || ""),
      building_height_m: String(body.building_height_m || ""),
      area_m2: String(body.area_m2 || ""),
      occupancy_profile_id: String(body.occupancy_profile_id || ""),
      risk_profile_id: String(body.risk_profile_id || ""),
      year_built: String(body.year_built || ""),
      last_major_renovation_year: String(body.last_major_renovation_year || ""),
      civil_defense_permit_no: String(body.civil_defense_permit_no || ""),
      evacuation_strategy: String(body.evacuation_strategy || ""),
      status: String(body.status || "active"),
      notes: String(body.notes || ""),
      created_at: nowIso(),
      updated_at: nowIso(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to create building" },
      { status: 400 }
    );
  }
}
