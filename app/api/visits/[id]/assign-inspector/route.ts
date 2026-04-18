import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { nowIso } from "@/lib/dates";
import { readSheet, updateRowById } from "@/lib/sheets";

function parseAllowedSystems(value: any): string[] {
  return String(value || "")
    .split(/[,;|\n،]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requirePermission("visits", "update");
    const { id } = await params;
    const workbookId = actor.workbookId;
    const body = await req.json().catch(() => ({}));

    if (String(actor.role || "").toLowerCase() === "inspector") {
      return NextResponse.json(
        {
          ok: false,
          message: "المفتش لا يسند الزيارات",
        },
        { status: 403 }
      );
    }

    const assignedInspectorId = String(body.assigned_inspector_id || "").trim();
    if (!assignedInspectorId) {
      return NextResponse.json(
        { ok: false, message: "اختر المفتش أولًا" },
        { status: 400 }
      );
    }

    const [visits, visitSystems, inspectors] = await Promise.all([
      readSheet(workbookId, "VISITS"),
      readSheet(workbookId, "VISIT_SYSTEMS"),
      readSheet(workbookId, "INSPECTORS"),
    ]);

    const visit = visits.find(
      (row: any) => String(row.visit_id || "") === String(id)
    );

    if (!visit) {
      return NextResponse.json(
        { ok: false, message: "Visit not found" },
        { status: 404 }
      );
    }

    const visitStatus = String(visit.visit_status || "").toLowerCase();
    if (visitStatus === "closed" || visitStatus === "completed") {
      return NextResponse.json(
        { ok: false, message: "لا يمكن إسناد زيارة مغلقة" },
        { status: 400 }
      );
    }

    const visitSystemRows = visitSystems.filter(
      (row: any) => String(row.visit_id || "") === String(id)
    );

    const requiredSystemCodes = [
      ...new Set(
        visitSystemRows
          .map((row: any): string => String(row.system_code || "").trim())
          .filter((value: string): boolean => value.length > 0)
      ),
    ];

    const inspector = inspectors.find(
      (row: any) => String(row.inspector_id || "") === assignedInspectorId
    );

    if (!inspector) {
      return NextResponse.json(
        { ok: false, message: "المفتش غير موجود" },
        { status: 404 }
      );
    }

    const inspectorStatus = String(inspector.status || "active").toLowerCase();
    if (inspectorStatus !== "active") {
      return NextResponse.json(
        { ok: false, message: "المفتش غير نشط" },
        { status: 400 }
      );
    }

    const allowedSystems = parseAllowedSystems(inspector.allowed_systems);
    const canInspect =
      allowedSystems.includes("*") ||
      requiredSystemCodes.every((code) => allowedSystems.includes(code));

    if (!canInspect) {
      return NextResponse.json(
        {
          ok: false,
          message: "المفتش المختار غير مؤهل لكل الأنظمة في هذه الزيارة",
        },
        { status: 400 }
      );
    }

    await updateRowById(workbookId, "VISITS", "visit_id", String(id), {
      assigned_inspector_id: assignedInspectorId,
      updated_at: nowIso(),
    });

    return NextResponse.json({
      ok: true,
      visit_id: String(id),
      assigned_inspector_id: assignedInspectorId,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error.message || "Failed to assign inspector",
      },
      { status: 400 }
    );
  }
}
