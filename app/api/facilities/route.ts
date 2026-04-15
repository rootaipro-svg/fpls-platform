import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet, appendRow } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";

export async function GET() {
  try {
    const user = await requirePermission("facilities", "view");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const facilities = await readSheet(workbookId, "FACILITIES");
    return NextResponse.json({ ok: true, data: facilities });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("facilities", "create");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const body = await req.json();
    await appendRow(workbookId, "FACILITIES", {
      facility_id: makeId("FAC"),
      facility_code: body.facility_code,
      facility_name: body.facility_name,
      facility_name_ar: body.facility_name_ar || "",
      owner_name: body.owner_name || "",
      operator_name: body.operator_name || "",
      facility_type: body.facility_type,
      occupancy_classification: body.occupancy_classification,
      city: body.city,
      district: body.district || "",
      address: body.address || "",
      latitude: body.latitude || "",
      longitude: body.longitude || "",
      contact_person: body.contact_person || "",
      contact_phone: body.contact_phone || "",
      contact_email: body.contact_email || "",
      authority_profile_id: body.authority_profile_id || "default_ksa",
      active_status: "active",
      notes: body.notes || "",
      created_at: nowIso(),
      updated_at: nowIso()
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }
}
