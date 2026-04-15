import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { appendRow } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("systems", "create");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const body = await req.json();

    await appendRow(workbookId, "BUILDING_SYSTEMS", {
      building_system_id: makeId("BSYS"),
      building_id: body.building_id,
      system_instance_code: body.system_instance_code,
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
      next_inspection_anchor_date: body.next_inspection_anchor_date || new Date().toISOString().slice(0, 10),
      notes: body.notes || "",
      created_at: nowIso(),
      updated_at: nowIso()
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }
}
