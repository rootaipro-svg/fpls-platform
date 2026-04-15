import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { appendRow, readSheet } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";

function makeSystemInstanceCode(systemCode: string) {
  return `${systemCode || "SYS"}-${Date.now().toString().slice(-6)}`;
}

export async function GET() {
  try {
    const user = await requirePermission("systems", "view");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const systems = await readSheet(workbookId, "BUILDING_SYSTEMS");
    return NextResponse.json({ ok: true, data: systems });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to load systems" },
      { status: 403 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("systems", "create");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const body = await req.json();

    if (!body.building_id || !body.system_code) {
      return NextResponse.json(
        { ok: false, message: "building_id and system_code are required" },
        { status: 400 }
      );
    }

    const buildingSystemId = makeId("BSYS");
    const systemInstanceCode = body.system_instance_code?.trim()
      ? body.system_instance_code.trim()
      : makeSystemInstanceCode(body.system_code);

    await appendRow(workbookId, "BUILDING_SYSTEMS", {
      building_system_id: buildingSystemId,
      building_id: body.building_id,
      system_instance_code: systemInstanceCode,
      system_code: body.system_code,
      system_name_override: body.system_name_override || "",
      coverage_scope: body.coverage_scope || "",
      protection_area: body.protection_area || "",
      standard_profile: body.standard_profile || body.system_code,
      authority_profile_id: body.authority_profile_id || "default_ksa",
      manufacturer: body.manufacturer || "",
      model: body.model || "",
      serial_no: body.serial_no || "",
      install_date: body.install_date || "",
      commission_date: body.commission_date || "",
      service_provider: body.service_provider || "",
      approval_lab_code: body.approval_lab_code || "",
      criticality_class: body.criticality_class || "primary",
      system_status: "active",
      next_inspection_anchor_date:
        body.next_inspection_anchor_date || new Date().toISOString().slice(0, 10),
      notes: body.notes || "",
      created_at: nowIso(),
      updated_at: nowIso()
    });

    const updatedSystems = await readSheet(workbookId, "BUILDING_SYSTEMS");

    return NextResponse.json({
      ok: true,
      message: "System created successfully",
      data: {
        building_system_id: buildingSystemId,
        system_instance_code: systemInstanceCode,
        total_systems: updatedSystems.length
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to create system" },
      { status: 400 }
    );
  }
}
