import { NextRequest, NextResponse } from "next/server";

import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { appendRow, readSheet, updateRowById } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";

type Row = Record<string, any>;

function text(value: unknown) {
  return String(value ?? "").trim();
}

function num(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function calcNetPsi(suction: unknown, discharge: unknown) {
  return round1(num(discharge) - num(suction));
}

function hasValue(value: unknown) {
  return text(value) !== "";
}

function evaluatePumpCurve(input: {
  ratedPressurePsi: number;
  churnNetPsi: number;
  ratedNetPsi: number;
  peakNetPsi: number;
  ratedFlowGpm: number;
  ratedFlowActualGpm: number;
  peakFlowActualGpm: number;
}) {
  const {
    ratedPressurePsi,
    churnNetPsi,
    ratedNetPsi,
    peakNetPsi,
    ratedFlowGpm,
    ratedFlowActualGpm,
    peakFlowActualGpm,
  } = input;

  if (!ratedPressurePsi || !ratedFlowGpm) {
    return {
      curve_result: "incomplete",
      test_result: "pending",
      summary:
        "بيانات Rated Flow أو Rated Pressure غير مكتملة، لا يمكن تقييم منحنى المضخة.",
    };
  }

  const checks: string[] = [];
  const warnings: string[] = [];

  const churnMax = ratedPressurePsi * 1.4;
  const ratedMin = ratedPressurePsi * 0.95;
  const peakMin = ratedPressurePsi * 0.65;
  const ratedFlowMin = ratedFlowGpm * 0.95;
  const peakFlowMin = ratedFlowGpm * 1.5 * 0.95;

  if (churnNetPsi > churnMax) {
    checks.push(
      `ضغط Churn مرتفع مقارنة بالحد المرجعي: ${churnNetPsi} PSI`
    );
  }

  if (ratedNetPsi < ratedMin) {
    checks.push(
      `ضغط نقطة 100% أقل من الحد المرجعي: ${ratedNetPsi} PSI`
    );
  }

  if (peakNetPsi < peakMin) {
    checks.push(
      `ضغط نقطة 150% أقل من الحد المرجعي: ${peakNetPsi} PSI`
    );
  }

  if (ratedFlowActualGpm < ratedFlowMin) {
    warnings.push(
      `تدفق نقطة 100% أقل من المتوقع: ${ratedFlowActualGpm} GPM`
    );
  }

  if (peakFlowActualGpm < peakFlowMin) {
    warnings.push(
      `تدفق نقطة 150% أقل من المتوقع: ${peakFlowActualGpm} GPM`
    );
  }

  if (checks.length > 0) {
    return {
      curve_result: "fail",
      test_result: "non_compliant",
      summary: checks.join(" | "),
    };
  }

  if (warnings.length > 0) {
    return {
      curve_result: "warning",
      test_result: "pass_with_remarks",
      summary: warnings.join(" | "),
    };
  }

  return {
    curve_result: "pass",
    test_result: "compliant",
    summary: "منحنى المضخة ضمن الحدود المرجعية المدخلة.",
  };
}

async function safeReadSheet(workbookId: string, sheetName: string) {
  try {
    return await readSheet(workbookId, sheetName);
  } catch {
    return [];
  }
}

function same(a: unknown, b: unknown) {
  return text(a) === text(b);
}

function buildPumpTestRow(body: Row, existingId?: string) {
  const ratedFlowGpm = num(body.rated_flow_gpm);
  const ratedPressurePsi = num(body.rated_pressure_psi);

  const churnNetPsi = calcNetPsi(
    body.churn_suction_psi,
    body.churn_discharge_psi
  );

  const ratedNetPsi = calcNetPsi(
    body.rated_suction_psi,
    body.rated_discharge_psi
  );

  const peakNetPsi = calcNetPsi(
    body.peak_suction_psi,
    body.peak_discharge_psi
  );

  const evaluation = evaluatePumpCurve({
    ratedPressurePsi,
    churnNetPsi,
    ratedNetPsi,
    peakNetPsi,
    ratedFlowGpm,
    ratedFlowActualGpm: num(body.rated_flow_actual_gpm),
    peakFlowActualGpm: num(body.peak_flow_actual_gpm),
  });

  const timestamp = nowIso();

  return {
    pump_test_id: existingId || text(body.pump_test_id) || makeId("FPT"),
    visit_id: text(body.visit_id),
    visit_system_id: text(body.visit_system_id),
    building_system_id: text(body.building_system_id),
    system_code: text(body.system_code),
    test_date: text(body.test_date) || new Date().toISOString().slice(0, 10),
    test_method: text(body.test_method || "flow_test"),
    pump_driver_type: text(body.pump_driver_type),

    rated_flow_gpm: text(body.rated_flow_gpm),
    rated_pressure_psi: text(body.rated_pressure_psi),
    rated_speed_rpm: text(body.rated_speed_rpm),

    churn_flow_gpm: text(body.churn_flow_gpm || "0"),
    churn_suction_psi: text(body.churn_suction_psi),
    churn_discharge_psi: text(body.churn_discharge_psi),
    churn_net_psi: String(churnNetPsi),
    churn_rpm: text(body.churn_rpm),

    rated_flow_actual_gpm: text(body.rated_flow_actual_gpm),
    rated_suction_psi: text(body.rated_suction_psi),
    rated_discharge_psi: text(body.rated_discharge_psi),
    rated_net_psi: String(ratedNetPsi),
    rated_rpm: text(body.rated_rpm),

    peak_flow_actual_gpm: text(body.peak_flow_actual_gpm),
    peak_suction_psi: text(body.peak_suction_psi),
    peak_discharge_psi: text(body.peak_discharge_psi),
    peak_net_psi: String(peakNetPsi),
    peak_rpm: text(body.peak_rpm),

    electric_voltage: text(body.electric_voltage),
    electric_amp_l1: text(body.electric_amp_l1),
    electric_amp_l2: text(body.electric_amp_l2),
    electric_amp_l3: text(body.electric_amp_l3),

    diesel_fuel_level: text(body.diesel_fuel_level),
    diesel_oil_pressure: text(body.diesel_oil_pressure),
    diesel_coolant_temp: text(body.diesel_coolant_temp),
    diesel_battery_status: text(body.diesel_battery_status),

    test_result: text(body.test_result) || evaluation.test_result,
    curve_result: evaluation.curve_result,
    inspector_notes:
      text(body.inspector_notes) ||
      evaluation.summary,

    created_at: text(body.created_at) || timestamp,
    updated_at: timestamp,
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await requirePermission("visits", "view");
    const workbookId = await getTenantWorkbookId(user.tenantId);

    const url = new URL(req.url);
    const visitId = text(url.searchParams.get("visit_id"));
    const visitSystemId = text(url.searchParams.get("visit_system_id"));
    const buildingSystemId = text(url.searchParams.get("building_system_id"));

    const rows = await safeReadSheet(workbookId, "FIRE_PUMP_TESTS");

    const filtered = rows.filter((row: Row) => {
      if (visitId && !same(row.visit_id, visitId)) return false;
      if (visitSystemId && !same(row.visit_system_id, visitSystemId)) return false;
      if (buildingSystemId && !same(row.building_system_id, buildingSystemId)) {
        return false;
      }

      return true;
    });

    return NextResponse.json({
      ok: true,
      data: filtered,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Failed to load fire pump tests",
      },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("responses", "create");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const body = await req.json();

    if (!hasValue(body.visit_id)) {
      throw new Error("visit_id is required");
    }

    if (!hasValue(body.visit_system_id)) {
      throw new Error("visit_system_id is required");
    }

    if (!hasValue(body.building_system_id)) {
      throw new Error("building_system_id is required");
    }

    const existingRows = await safeReadSheet(workbookId, "FIRE_PUMP_TESTS");

    const matched = existingRows.find((row: Row) => {
      if (hasValue(body.pump_test_id)) {
        return same(row.pump_test_id, body.pump_test_id);
      }

      return same(row.visit_system_id, body.visit_system_id);
    });

    const pumpTestId = matched
      ? text(matched.pump_test_id)
      : text(body.pump_test_id) || makeId("FPT");

    const row = buildPumpTestRow(
      {
        ...body,
        pump_test_id: pumpTestId,
        created_at: matched?.created_at || body.created_at || "",
      },
      pumpTestId
    );

    if (matched) {
      await updateRowById(
        workbookId,
        "FIRE_PUMP_TESTS",
        "pump_test_id",
        pumpTestId,
        row
      );
    } else {
      await appendRow(workbookId, "FIRE_PUMP_TESTS", row);
    }

    return NextResponse.json({
      ok: true,
      pumpTestId,
      data: row,
      curve_result: row.curve_result,
      test_result: row.test_result,
      summary: row.inspector_notes,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Failed to save fire pump test",
      },
      { status: 400 }
    );
  }
}
