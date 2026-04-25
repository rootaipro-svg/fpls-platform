import { NextRequest, NextResponse } from "next/server";

import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

type Row = Record<string, any>;

function text(value: unknown) {
  return String(value ?? "").trim();
}

function same(a: unknown, b: unknown) {
  return text(a) === text(b);
}

async function safeReadSheet(workbookId: string, sheetName: string) {
  try {
    return await readSheet(workbookId, sheetName);
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requirePermission("visits", "view");
    const workbookId =
      user.workbookId || (await getTenantWorkbookId(user.tenantId));

    const url = new URL(req.url);
    const buildingSystemId = text(url.searchParams.get("building_system_id"));
    const systemCode = text(url.searchParams.get("system_code"));

    const rows = await safeReadSheet(workbookId, "FIRE_PUMP_PROFILES");

    const filtered = rows.filter((row: Row) => {
      if (buildingSystemId && !same(row.building_system_id, buildingSystemId)) {
        return false;
      }

      if (systemCode && !same(row.system_code, systemCode)) {
        return false;
      }

      return true;
    });

    return NextResponse.json({
      ok: true,
      data: filtered,
      profile: filtered[0] || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Failed to load fire pump profile",
      },
      { status: 400 }
    );
  }
}
