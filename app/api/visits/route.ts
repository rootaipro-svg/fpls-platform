import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { appendRow, readSheet } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";

export async function GET() {
  try {
    const user = await requirePermission("visits", "view");
    const workbookId = await getTenantWorkbookId(user.tenantId);

    const visits = await readSheet(workbookId, "VISITS");

    return NextResponse.json({
      ok: true,
      data: visits,
    });
  } catch (error: any) {
    console.error("GET_VISITS_ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Failed to load visits",
      },
      { status: 403 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("visits", "create");
    const workbookId = await getTenantWorkbookId(user.tenantId);

    const body = await req.json();

    /**
     * Normalize incoming systems data.
     *
     * Expected from frontend:
     * systems: [
     *   {
     *     building_system_id: "...",
     *     system_code: "fire_alarm"
     *   }
     * ]
     *
     * Optional:
     * system_codes: ["fire_alarm", "fire_pump"]
     */
    const systems = Array.isArray(body.systems) ? body.systems : [];

    const systemCodes = Array.isArray(body.system_codes)
      ? body.system_codes
          .map((code: any) => String(code || "").trim())
          .filter(Boolean)
      : systems
          .map((system: any) => String(system?.system_code || "").trim())
          .filter(Boolean);

    /**
     * Required fields validation.
     * This prevents errors like:
     * Cannot read properties of undefined reading "join"
     */
    if (!body.facility_id) {
      return NextResponse.json(
        {
          ok: false,
          message: "facility_id is required",
        },
        { status: 400 }
      );
    }

    if (!body.building_id) {
      return NextResponse.json(
        {
          ok: false,
          message: "building_id is required",
        },
        { status: 400 }
      );
    }

    if (!body.planned_date) {
      return NextResponse.json(
        {
          ok: false,
          message: "planned_date is required",
        },
        { status: 400 }
      );
    }

    if (systems.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "At least one system is required",
        },
        { status: 400 }
      );
    }

    const validSystems = systems
      .map((system: any) => ({
        building_system_id: String(system?.building_system_id || "").trim(),
        system_code: String(system?.system_code || "").trim(),
      }))
      .filter(
        (system: any) => system.building_system_id && system.system_code
      );

    if (validSystems.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Selected systems are invalid. building_system_id and system_code are required.",
        },
        { status: 400 }
      );
    }

    const visitId = makeId("VIS");
    const timestamp = nowIso();

    await appendRow(workbookId, "VISITS", {
      visit_id: visitId,
      facility_id: body.facility_id,
      building_id: body.building_id,
      visit_type: body.visit_type || "routine",
      visit_date: "",
      planned_date: body.planned_date,
      due_date: body.due_date || body.planned_date,
      next_due_date: "",
      assigned_inspector_id: body.assigned_inspector_id || "",
      assigned_system_scope:
        systemCodes.length > 0
          ? systemCodes.join("|")
          : validSystems.map((system) => system.system_code).join("|"),
      visit_status: "planned",
      summary_result: "pending",
      notes: body.notes || "",
      created_at: timestamp,
      updated_at: timestamp,
    });

    for (const system of validSystems) {
      await appendRow(workbookId, "VISIT_SYSTEMS", {
        visit_system_id: makeId("VSYS"),
        visit_id: visitId,
        building_system_id: system.building_system_id,
        system_code: system.system_code,
        checklist_version: "active",
        planned_start_time: "",
        planned_end_time: "",
        actual_start_time: "",
        actual_end_time: "",
        result_summary: "pending",
        compliance_percent: 0,
        critical_count: 0,
        major_count: 0,
        minor_count: 0,
        next_due_date: "",
        status: "planned",
        notes: "",
        created_at: timestamp,
        updated_at: timestamp,
      });
    }

    return NextResponse.json({
      ok: true,
      visitId,
      message: "Visit created successfully",
    });
  } catch (error: any) {
    console.error("CREATE_VISIT_ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Failed to create visit",
        debug:
          process.env.NODE_ENV === "development"
            ? String(error?.stack || error)
            : undefined,
      },
      { status: 400 }
    );
  }
}
