import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { updateRowById } from "@/lib/sheets";

function nowIso() {
  return new Date().toISOString();
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission("facilities", "view");
    const { id } = await params;
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const body = await req.json();

    if (String(body.action || "") === "archive") {
      await updateRowById(workbookId, "BUILDINGS", "building_id", String(id), {
        status: "archived",
        updated_at: nowIso(),
      });

      return NextResponse.json({ ok: true });
    }

    await updateRowById(workbookId, "BUILDINGS", "building_id", String(id), {
      building_code: body.building_code ?? "",
      building_name: body.building_name ?? "",
      building_name_ar: body.building_name_ar ?? "",
      building_use: body.building_use ?? "",
      construction_type: body.construction_type ?? "",
      number_of_floors: body.number_of_floors ?? "",
      basement_count: body.basement_count ?? "",
      building_height_m: body.building_height_m ?? "",
      area_m2: body.area_m2 ?? "",
      occupancy_profile_id: body.occupancy_profile_id ?? "",
      risk_profile_id: body.risk_profile_id ?? "",
      year_built: body.year_built ?? "",
      last_major_renovation_year: body.last_major_renovation_year ?? "",
      civil_defense_permit_no: body.civil_defense_permit_no ?? "",
      evacuation_strategy: body.evacuation_strategy ?? "",
      status: body.status ?? "active",
      notes: body.notes ?? "",
      updated_at: nowIso(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to update building" },
      { status: 400 }
    );
  }
}
