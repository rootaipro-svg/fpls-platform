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

    if (!String(body.building_id || "").trim()) {
      throw new Error("building_id is required");
    }

    if (!String(body.system_code || "").trim()) {
      throw new Error("system_code is required");
    }

    await appendRow(workbookId, "BUILDING_SYSTEMS", {
      building_system_id: makeId("BSY"),
      building_id: String(body.building_id || ""),
      system_instance_code: String(body.system_instance_code || ""),
      system_code: String(body.system_code || ""),
      system_name_override: String(body.system_name_override || ""),
      coverage_scope: String(body.coverage_scope || ""),
      protection_area: String(body.protection_area || ""),
      standard_profile: String(body.standard_profile || ""),
      authority_profile_id: String(body.authority_profile_id || ""),
      manufacturer: String(body.manufacturer || ""),
      model: String(body.model || ""),
      serial_no: String(body.serial_no || ""),
      install_date: String(body.install_date || ""),
      commission_date: String(body.commission_date || ""),
      service_provider: String(body.service_provider || ""),
      approval_lab_code: String(body.approval_lab_code || ""),
      criticality_class: String(body.criticality_class || ""),
      system_status: String(body.system_status || "active"),
      next_inspection_anchor_date: String(body.next_inspection_anchor_date || ""),
      notes: String(body.notes || ""),
      created_at: nowIso(),
      updated_at: nowIso(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to create building system" },
      { status: 400 }
    );
  }
}
