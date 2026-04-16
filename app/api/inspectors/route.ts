import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { appendRows } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";

export async function POST(req: NextRequest) {
  try {
    const actor = await requirePermission("settings", "update");
    const body = await req.json();

    const createdAt = nowIso();
    const inspectorId = makeId("INSP");

    await appendRows(actor.workbookId, "INSPECTORS", [
      {
        inspector_id: inspectorId,
        inspector_code: String(body.inspector_code || inspectorId),
        full_name: String(body.full_name || ""),
        full_name_ar: String(body.full_name_ar || ""),
        employer_name: String(body.employer_name || ""),
        phone: String(body.phone || ""),
        email: String(body.email || ""),
        national_id_or_iqama: String(body.national_id_or_iqama || ""),
        region_base: String(body.region_base || ""),
        status: String(body.status || "active").toLowerCase(),
        notes: String(body.notes || ""),
        created_at: createdAt,
        updated_at: createdAt,
        app_user_id: String(body.app_user_id || ""),
        allowed_systems: String(body.allowed_systems || ""),
      },
    ]);

    return NextResponse.json({
      ok: true,
      data: { inspector_id: inspectorId },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to create inspector" },
      { status: 400 }
    );
  }
}
