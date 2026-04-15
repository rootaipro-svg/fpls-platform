import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet, appendRow } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";

function makeFacilityCode(name: string) {
  const cleaned = (name || "FAC")
    .replace(/[^a-zA-Z0-9\u0600-\u06FF ]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join("-")
    .toUpperCase();

  return `${cleaned || "FAC"}-${Date.now().toString().slice(-6)}`;
}

export async function GET() {
  try {
    const user = await requirePermission("facilities", "view");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const facilities = await readSheet(workbookId, "FACILITIES");
    return NextResponse.json({ ok: true, data: facilities });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to load facilities" },
      { status: 403 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("facilities", "create");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const body = await req.json();

    if (!body.facility_name || !body.city || !body.facility_type || !body.occupancy_classification) {
      return NextResponse.json(
        {
          ok: false,
          message: "facility_name, city, facility_type, and occupancy_classification are required"
        },
        { status: 400 }
      );
    }

    const facilityId = makeId("FAC");
    const facilityCode = body.facility_code?.trim()
      ? body.facility_code.trim()
      : makeFacilityCode(body.facility_name);

    await appendRow(workbookId, "FACILITIES", {
      facility_id: facilityId,
      facility_code: facilityCode,
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

    const updatedFacilities = await readSheet(workbookId, "FACILITIES");

    return NextResponse.json({
      ok: true,
      message: "Facility created successfully",
      data: {
        facility_id: facilityId,
        facility_code: facilityCode,
        total_facilities: updatedFacilities.length
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to create facility" },
      { status: 400 }
    );
  }
}
