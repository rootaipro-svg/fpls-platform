import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";

function parseAllowedSystems(value: any): string[] {
  return String(value || "")
    .split(/[,;|\n،]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requirePermission("visits", "create");
    const { id } = await params;
    const workbookId = actor.workbookId;

    if (String(actor.role || "").toLowerCase() === "inspector") {
      return NextResponse.json(
        {
          ok: false,
          message: "المفتش لا ينشئ زيارة جديدة من الأصل",
        },
        { status: 403 }
      );
    }

    const [assets, inspectors] = await Promise.all([
      readSheet(workbookId, "ASSETS"),
      readSheet(workbookId, "INSPECTORS"),
    ]);

    const asset = assets.find(
      (row: any) => String(row.asset_id || "") === String(id)
    );

    if (!asset) {
      return NextResponse.json(
        { ok: false, message: "Asset not found" },
        { status: 404 }
      );
    }

    const systemCode = String(asset.system_code || "");

    const eligibleInspectors = inspectors
      .filter((row: any) => {
        const status = String(row.status || "active").toLowerCase();
        if (status !== "active") return false;

        const allowedSystems = parseAllowedSystems(row.allowed_systems);
        return (
          allowedSystems.includes("*") || allowedSystems.includes(systemCode)
        );
      })
      .map((row: any) => ({
        inspector_id: String(row.inspector_id || ""),
        inspector_name: String(
          row.full_name_ar ||
            row.full_name ||
            row.email ||
            row.inspector_id ||
            "Inspector"
        ),
      }));

    return NextResponse.json({
      ok: true,
      inspectors: eligibleInspectors,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error.message || "Failed to load eligible inspectors",
      },
      { status: 400 }
    );
  }
}
