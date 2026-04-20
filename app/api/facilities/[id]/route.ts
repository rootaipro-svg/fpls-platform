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
      await updateRowById(workbookId, "FACILITIES", "facility_id", String(id), {
        active_status: "archived",
        updated_at: nowIso(),
      });

      return NextResponse.json({ ok: true });
    }

    await updateRowById(workbookId, "FACILITIES", "facility_id", String(id), {
      facility_code: body.facility_code ?? "",
      facility_name: body.facility_name ?? "",
      facility_name_ar: body.facility_name_ar ?? "",
      owner_name: body.owner_name ?? "",
      operator_name: body.operator_name ?? "",
      facility_type: body.facility_type ?? "",
      occupancy_classification: body.occupancy_classification ?? "",
      city: body.city ?? "",
      district: body.district ?? "",
      address: body.address ?? "",
      latitude: body.latitude ?? "",
      longitude: body.longitude ?? "",
      contact_person: body.contact_person ?? "",
      contact_phone: body.contact_phone ?? "",
      contact_email: body.contact_email ?? "",
      authority_profile_id: body.authority_profile_id ?? "",
      active_status: body.active_status ?? "active",
      notes: body.notes ?? "",
      updated_at: nowIso(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to update facility" },
      { status: 400 }
    );
  }
}
