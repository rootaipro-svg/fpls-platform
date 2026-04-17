import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { appendRow, readSheet } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";

export async function POST(req: NextRequest) {
  try {
    const actor = await requirePermission("facilities", "update");
    const workbookId = actor.workbookId;
    const body = await req.json();

    const buildingSystemId = String(body.building_system_id || "").trim();
    const assetName = String(body.asset_name || "").trim();

    if (!buildingSystemId) {
      throw new Error("building_system_id is required");
    }

    if (!assetName) {
      throw new Error("asset_name is required");
    }

    const buildingSystems = await readSheet(workbookId, "BUILDING_SYSTEMS");
    const matchedSystem = buildingSystems.find(
      (row) => String(row.building_system_id) === buildingSystemId
    );

    if (!matchedSystem) {
      throw new Error("Selected building system was not found");
    }

    const assetId = makeId("AST");
    const timestamp = nowIso();

    await appendRow(workbookId, "ASSETS", {
      asset_id: assetId,
      asset_code: String(body.asset_code || assetId),
      tenant_id: String(actor.tenantId || ""),
      facility_id: String(matchedSystem.facility_id || ""),
      building_id: String(matchedSystem.building_id || ""),
      building_system_id: String(matchedSystem.building_system_id || ""),
      system_code: String(matchedSystem.system_code || ""),
      asset_name: assetName,
      asset_name_ar: String(body.asset_name_ar || ""),
      asset_type: String(body.asset_type || ""),
      location_note: String(body.location_note || ""),
      qr_code_value: `FPLS|${String(actor.tenantId || "")}|${assetId}`,
      status: String(body.status || "active"),
      created_at: timestamp,
      updated_at: timestamp,
    });

    return NextResponse.json({
      ok: true,
      data: {
        asset_id: assetId,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error.message || "Failed to create asset",
      },
      { status: 400 }
    );
  }
}
