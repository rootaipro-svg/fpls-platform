import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { appendRow, readSheet } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";
import {
  calcOutletFlow,
  calcPumpPoint,
  overallPumpResult,
  PumpOutletInput,
  PumpPointInput,
} from "@/lib/fire-pump-calcs";

type PumpPointBody = PumpPointInput & {
  outlets?: PumpOutletInput[];
};

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function json(value: unknown): string {
  try {
    return JSON.stringify(value ?? []);
  } catch {
    return "[]";
  }
}

async function safeReadSheet(workbookId: string, sheetName: string) {
  try {
    return await readSheet(workbookId, sheetName);
  } catch {
    return [];
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission("visits", "view");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const { id } = await params;

    const url = new URL(req.url);
    const visitSystemId = text(url.searchParams.get("visit_system_id"));

    const [tests, points, outlets] = await Promise.all([
      safeReadSheet(workbookId, "PUMP_TESTS"),
      safeReadSheet(workbookId, "PUMP_TEST_POINTS"),
      safeReadSheet(workbookId, "PUMP_TEST_OUTLETS"),
    ]);

    const matchedTests = tests.filter((row: any) => {
      const sameVisit = text(row.visit_id) === text(id);
      const sameSystem =
        !visitSystemId || text(row.visit_system_id) === visitSystemId;
      return sameVisit && sameSystem;
    });

    const testIds = new Set(
      matchedTests.map((row: any) => text(row.pump_test_id))
    );

    const matchedPoints = points.filter((row: any) =>
      testIds.has(text(row.pump_test_id))
    );

    const pointIds = new Set(
      matchedPoints.map((row: any) => text(row.point_id))
    );

    const matchedOutlets = outlets.filter((row: any) =>
      pointIds.has(text(row.point_id))
    );

    return NextResponse.json({
      ok: true,
      data: {
        tests: matchedTests,
        points: matchedPoints,
        outlets: matchedOutlets,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Failed to load pump test",
      },
      { status: 403 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission("responses", "create");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const { id } = await params;

    const body = await req.json();

    const visitSystemId = text(body.visit_system_id);
    const buildingSystemId = text(body.building_system_id);

    if (!visitSystemId) {
      return NextResponse.json(
        { ok: false, message: "visit_system_id is required" },
        { status: 400 }
      );
    }

    const ratedFlowGpm = text(body.rated_flow_gpm);
    const ratedPressurePsi = text(body.rated_pressure_psi);
    const ratedSpeedRpm = text(body.rated_speed_rpm);

    if (!ratedFlowGpm || !ratedPressurePsi) {
      return NextResponse.json(
        {
          ok: false,
          message: "Rated flow and rated pressure are required",
        },
        { status: 400 }
      );
    }

    const rawPoints: PumpPointBody[] = Array.isArray(body.points)
      ? body.points
      : [];

    if (rawPoints.length === 0) {
      return NextResponse.json(
        { ok: false, message: "At least one pump test point is required" },
        { status: 400 }
      );
    }

    const calculatedPoints = rawPoints.map((point) => {
      return {
        input: point,
        calc: calcPumpPoint({
          ...point,
          rated_flow_gpm: ratedFlowGpm,
          rated_pressure_psi: ratedPressurePsi,
          rated_speed_rpm: ratedSpeedRpm,
        }),
      };
    });

    const overallResult = overallPumpResult(
      calculatedPoints.map((row) => row.calc)
    );

    const technicalJudgment =
      overallResult === "compliant"
        ? "أداء مضخة الحريق مقبول حسب القراءات المدخلة."
        : overallResult === "pass_with_remarks"
        ? "أداء مضخة الحريق مقبول مع ملاحظات تحتاج مراجعة فنية."
        : overallResult === "non_compliant"
        ? "أداء مضخة الحريق غير مقبول حسب القراءات المدخلة، ويحتاج إجراء تصحيحي."
        : "اختبار المضخة غير مكتمل، يرجى استكمال القراءات المطلوبة.";

    const pumpTestId = makeId("PTST");
    const timestamp = nowIso();

    await appendRow(workbookId, "PUMP_TESTS", {
      pump_test_id: pumpTestId,
      visit_id: id,
      visit_system_id: visitSystemId,
      building_system_id: buildingSystemId,
      pump_tag: text(body.pump_tag),
      driver_type: text(body.driver_type || "electric"),
      test_method: text(body.test_method || "flowmeter"),
      rated_flow_gpm: ratedFlowGpm,
      rated_pressure_psi: ratedPressurePsi,
      rated_speed_rpm: ratedSpeedRpm,
      overall_result: overallResult,
      technical_judgment: technicalJudgment,
      created_by: text(user.appUserId || user.email || ""),
      created_at: timestamp,
      updated_at: timestamp,
    });

    for (const row of calculatedPoints) {
      const point = row.input;
      const calc = row.calc;
      const pointId = makeId("PNT");

      await appendRow(workbookId, "PUMP_TEST_POINTS", {
        point_id: pointId,
        pump_test_id: pumpTestId,
        visit_id: id,
        visit_system_id: visitSystemId,
        point_type: text(point.point_type),
        target_flow_percent: text(point.target_flow_percent),
        target_flow_gpm: text(point.target_flow_gpm),
        actual_flow_gpm: String(calc.actual_flow_gpm),
        suction_pressure_psi: text(point.suction_pressure_psi),
        discharge_pressure_psi: text(point.discharge_pressure_psi),
        net_pressure_psi: String(calc.net_pressure_psi),
        rpm: text(point.rpm),
        percent_rated_flow: String(calc.percent_rated_flow),
        percent_rated_pressure: String(calc.percent_rated_pressure),
        corrected_flow_gpm: String(calc.corrected_flow_gpm),
        corrected_pressure_psi: String(calc.corrected_pressure_psi),
        result: calc.result,
        warnings: json(calc.warnings),
        notes: text(point.notes),
        created_at: timestamp,
        updated_at: timestamp,
      });

      const outlets = Array.isArray(point.outlets) ? point.outlets : [];

      for (const outlet of outlets) {
        await appendRow(workbookId, "PUMP_TEST_OUTLETS", {
          outlet_id: makeId("OUT"),
          point_id: pointId,
          pump_test_id: pumpTestId,
          outlet_no: text(outlet.outlet_no),
          device_type: text(outlet.device_type || "hose_header"),
          nozzle_diameter_in: text(outlet.nozzle_diameter_in),
          coefficient: text(outlet.coefficient || "0.9"),
          pitot_pressure_psi: text(outlet.pitot_pressure_psi),
          calculated_flow_gpm: String(calcOutletFlow(outlet)),
          notes: text(outlet.notes),
          created_at: timestamp,
          updated_at: timestamp,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      pumpTestId,
      overallResult,
      technicalJudgment,
    });
  } catch (error: any) {
    console.error("SAVE_PUMP_TEST_ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Failed to save pump test",
      },
      { status: 400 }
    );
  }
}
