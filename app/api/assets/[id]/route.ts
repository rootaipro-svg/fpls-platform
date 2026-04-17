import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { readSheet, updateRowById } from "@/lib/sheets";
import { nowIso } from "@/lib/dates";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requirePermission("facilities", "update");
    const workbookId = actor.workbookId;
    const { id } = await params;
    const body = await req.json();

    const assets = await readSheet(workbookId, "ASSETS");
    const asset = assets.find(
      (row) => String(row.asset_id) === String(id)
    );

    if (!asset) {
      return NextResponse.json(
        { ok: false, message: "Asset not found" },
        { status: 404 }
      );
    }

    await updateRowById(workbookId, "ASSETS", "asset_id", String(id), {
      asset_code: String(body.asset_code || ""),
      asset_name: String(body.asset_name || ""),
      asset_name_ar: String(body.asset_name_ar || ""),
      asset_type: String(body.asset_type || ""),
      location_note: String(body.location_note || ""),
      status: String(body.status || "active"),
      updated_at: nowIso(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error.message || "Failed to update asset",
      },
      { status: 400 }
    );
  }
}
