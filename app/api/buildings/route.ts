import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { appendRow, readSheet } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";

function makeBuildingCode(name: string) {
  const cleaned = (name || "BLD")
    .replace(/[^a-zA-Z0-9\u0600-\u06FF ]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join("-")
    .toUpperCase();

  return `${cleaned || "BLD"}-${Date.now().toString().slice(-6)}`;
}

function makeSystemInstanceCode(systemCode: string) {
  return `${systemCode || "SYS"}-${Date.now().toString().slice(-6)}`;
}

export async function GET() {
  try {
    const user = await requirePermission("buildings", "view");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const buildings = await readSheet(workbookId, "BUILDINGS");
    return NextResponse.json({ ok: true, data: buildings });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to load buildings" },
      { status: 403 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("buildings", "create");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const body = await req.json();

    if (
      !body.facility_id ||
      !body.building_name ||
      !body.building_use ||
      !body.occupancy_profile_id ||
      !body.risk_profile_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "facility_id, building_name, building_use, occupancy_profile_id, and risk_profile_id are required",
        },
        { status: 400 }
      );
    }

    const buildingId = makeId("BLD");
    const buildingCode = body.building_code?.trim()
      ? body.building_code.trim()
      : makeBuildingCode(body.building_name);

    await appendRow(workbookId, "BUILDINGS", {
      building_id: buildingId,
      facility_id: body.facility_id,
      building_code: buildingCode,
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
      updated_at: nowIso(),
    });

    const systemCodes: string[] = Array.isArray(body.system_codes)
      ? body.system_codes.filter(Boolean)
      : [];

    for (const systemCode of systemCodes) {
      await appendRow(workbookId, "BUILDING_SYSTEMS", {
        building_system_id: makeId("BSYS"),
        building_id: buildingId,
        system_instance_code: makeSystemInstanceCode(systemCode),
        system_code: systemCode,
        system_name_override: "",
        coverage_scope: "full building",
        protection_area: "",
        standard_profile: systemCode,
        authority_profile_id: "default_ksa",
        manufacturer: "",
        model: "",
        serial_no: "",
        install_date: "",
        commission_date: "",
        service_provider: "",
        approval_lab_code: "",
        criticality_class: "primary",
        system_status: "active",
        next_inspection_anchor_date: new Date().toISOString().slice(0, 10),
        notes: "",
        created_at: nowIso(),
        updated_at: nowIso(),
      });
    }

    const updatedBuildings = await readSheet(workbookId, "BUILDINGS");

    return NextResponse.json({
      ok: true,
      message: "Building created successfully",
      data: {
        building_id: buildingId,
        building_code: buildingCode,
        total_buildings: updatedBuildings.length,
        systems_created: systemCodes.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to create building" },
      { status: 400 }
    );
  }
}
