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
      await updateRowById(
        workbookId,
        "BUILDING_SYSTEMS",
        "building_system_id",
        String(id),
        {
          system_status: "archived",
          updated_at: nowIso(),
        }
      );

      return NextResponse.json({ ok: true });
    }

    await updateRowById(
      workbookId,
      "BUILDING_SYSTEMS",
      "building_system_id",
      String(id),
      {
        system_instance_code: body.system_instance_code ?? "",
        system_code: body.system_code ?? "",
        system_name_override: body.system_name_override ?? "",
        coverage_scope: body.coverage_scope ?? "",
        protection_area: body.protection_area ?? "",
        standard_profile: body.standard_profile ?? "",
        authority_profile_id: body.authority_profile_id ?? "",
        manufacturer: body.manufacturer ?? "",
        model: body.model ?? "",
        serial_no: body.serial_no ?? "",
        install_date: body.install_date ?? "",
        commission_date: body.commission_date ?? "",
        service_provider: body.service_provider ?? "",
        approval_lab_code: body.approval_lab_code ?? "",
        criticality_class: body.criticality_class ?? "",
        system_status: body.system_status ?? "active",
        next_inspection_anchor_date: body.next_inspection_anchor_date ?? "",
        notes: body.notes ?? "",
        updated_at: nowIso(),
      }
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to update building system" },
      { status: 400 }
    );
  }
}
