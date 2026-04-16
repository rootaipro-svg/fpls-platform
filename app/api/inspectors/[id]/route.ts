import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { updateRowById } from "@/lib/sheets";
import { nowIso } from "@/lib/dates";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requirePermission("settings", "update");
    const { id } = await params;
    const body = await req.json();

    await updateRowById(actor.workbookId, "INSPECTORS", "inspector_id", id, {
      inspector_code: String(body.inspector_code || ""),
      full_name: String(body.full_name || ""),
      full_name_ar: String(body.full_name_ar || ""),
      employer_name: String(body.employer_name || ""),
      phone: String(body.phone || ""),
      email: String(body.email || ""),
      national_id_or_iqama: String(body.national_id_or_iqama || ""),
      region_base: String(body.region_base || ""),
      status: String(body.status || "active").toLowerCase(),
      notes: String(body.notes || ""),
      app_user_id: String(body.app_user_id || ""),
      allowed_systems: String(body.allowed_systems || ""),
      updated_at: nowIso(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to update inspector" },
      { status: 400 }
    );
  }
}
