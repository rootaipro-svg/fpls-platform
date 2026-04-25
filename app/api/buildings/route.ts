import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { appendRow, readSheet } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function makeBuildingCode(name: string) {
  const cleaned = text(name || "BLD")
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

function getAppBaseUrl(req: NextRequest) {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;

  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  const origin = req.headers.get("origin");

  if (origin) {
    return origin.replace(/\/$/, "");
  }

  return "https://fpls-platform.vercel.app";
}

export async function GET() {
  try {
    const user = await requirePermission("buildings", "view");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const buildings = await readSheet(workbookId, "BUILDINGS");

    return NextResponse.json({
      ok: true,
      data: buildings,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Failed to load buildings",
      },
      { status: 403 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("buildings", "create");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const body = await req.json();

    const facilityId = text(body.facility_id);
    const buildingName = text(body.building_name || body.building_name_ar);

    if (!facilityId) {
      return NextResponse.json(
        {
          ok: false,
          message: "facility_id is required",
        },
        { status: 400 }
      );
    }

    if (!buildingName) {
      return NextResponse.json(
        {
          ok: false,
          message: "building_name أو building_name_ar مطلوب",
        },
        { status: 400 }
      );
    }

    const timestamp = nowIso();
    const buildingId = makeId("BLD");
    const buildingCode = text(body.building_code) || makeBuildingCode(buildingName);

    await appendRow(workbookId, "BUILDINGS", {
      building_id: buildingId,
      facility_id: facilityId,
      building_code: buildingCode,
      building_name: text(body.building_name) || buildingName,
      building_name_ar: text(body.building_name_ar),
      building_use: text(body.building_use) || "general",
      construction_type: text(body.construction_type),
      number_of_floors: text(body.number_of_floors) || "1",
      basement_count: text(body.basement_count) || "0",
      building_height_m: text(body.building_height_m),
      area_m2: text(body.area_m2),
      occupancy_profile_id: text(body.occupancy_profile_id) || "default",
      risk_profile_id: text(body.risk_profile_id) || "default",
      year_built: text(body.year_built),
      last_major_renovation_year: text(body.last_major_renovation_year),
      civil_defense_permit_no: text(body.civil_defense_permit_no),
      evacuation_strategy: text(body.evacuation_strategy),
      status: text(body.status) || "active",
      notes: text(body.notes),
      created_at: timestamp,
      updated_at: timestamp,
    });

    const appBaseUrl = getAppBaseUrl(req);
    const systemCodes: string[] = Array.isArray(body.system_codes)
      ? body.system_codes.map((value: unknown) => text(value)).filter(Boolean)
      : [];

    const createdSystems: any[] = [];

    for (const systemCode of systemCodes) {
      const buildingSystemId = makeId("BSYS");
      const qrUrl = `${appBaseUrl}/systems/${buildingSystemId}`;

      await appendRow(workbookId, "BUILDING_SYSTEMS", {
        building_system_id: buildingSystemId,
        building_id: buildingId,
        system_instance_code: makeSystemInstanceCode(systemCode),
        system_code: systemCode,
        system_name_override: "",
        coverage_scope: "كامل المبنى",
        protection_area: "",
        standard_profile: systemCode,
        authority_profile_id: text(body.authority_profile_id) || "default",
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
        created_at: timestamp,
        updated_at: timestamp,
        qr_enabled: "TRUE",
        qr_url: qrUrl,
        qr_label: `${buildingName} - ${systemCode}`,
      });

      createdSystems.push({
        building_system_id: buildingSystemId,
        system_code: systemCode,
        qr_url: qrUrl,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Building created successfully",
      buildingId,
      building_id: buildingId,
      buildingCode,
      building_code: buildingCode,
      createdSystems,
      data: {
        building_id: buildingId,
        building_code: buildingCode,
        created_systems: createdSystems,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Failed to create building",
      },
      { status: 400 }
    );
  }
}
