export type PumpOutletInput = {
  outlet_no?: string | number;
  device_type?: string;
  nozzle_diameter_in?: string | number;
  coefficient?: string | number;
  pitot_pressure_psi?: string | number;
  notes?: string;
};

export type PumpPointInput = {
  point_type: string;
  target_flow_percent?: string | number;
  target_flow_gpm?: string | number;
  actual_flow_gpm?: string | number;
  suction_pressure_psi?: string | number;
  discharge_pressure_psi?: string | number;
  rpm?: string | number;
  rated_flow_gpm?: string | number;
  rated_pressure_psi?: string | number;
  rated_speed_rpm?: string | number;
  outlets?: PumpOutletInput[];
  notes?: string;
};

export type PumpPointCalculated = {
  actual_flow_gpm: number;
  net_pressure_psi: number;
  percent_rated_flow: number;
  percent_rated_pressure: number;
  corrected_flow_gpm: number;
  corrected_pressure_psi: number;
  result: "pass" | "warning" | "fail" | "incomplete";
  warnings: string[];
};

export function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calcPitotFlowGpm(
  nozzleDiameterIn: unknown,
  pitotPressurePsi: unknown,
  coefficient: unknown = 0.9
): number {
  const d = toNumber(nozzleDiameterIn);
  const p = toNumber(pitotPressurePsi);
  const c = toNumber(coefficient) || 0.9;

  if (d <= 0 || p <= 0) return 0;

  return round1(29.83 * c * d * d * Math.sqrt(p));
}

export function calcOutletFlow(outlet: PumpOutletInput): number {
  return calcPitotFlowGpm(
    outlet.nozzle_diameter_in,
    outlet.pitot_pressure_psi,
    outlet.coefficient
  );
}

export function sumOutletFlows(outlets: PumpOutletInput[] = []): number {
  return round1(
    outlets.reduce((sum, outlet) => {
      return sum + calcOutletFlow(outlet);
    }, 0)
  );
}

export function calcPumpPoint(input: PumpPointInput): PumpPointCalculated {
  const ratedFlow = toNumber(input.rated_flow_gpm);
  const ratedPressure = toNumber(input.rated_pressure_psi);
  const ratedRpm = toNumber(input.rated_speed_rpm);

  const outletFlow = sumOutletFlows(input.outlets || []);
  const directFlow = toNumber(input.actual_flow_gpm);

  const actualFlow = directFlow > 0 ? directFlow : outletFlow;

  const suctionPressure = toNumber(input.suction_pressure_psi);
  const dischargePressure = toNumber(input.discharge_pressure_psi);
  const netPressure = round1(dischargePressure - suctionPressure);

  const rpm = toNumber(input.rpm);

  const percentRatedFlow =
    ratedFlow > 0 ? round1((actualFlow / ratedFlow) * 100) : 0;

  const percentRatedPressure =
    ratedPressure > 0 ? round1((netPressure / ratedPressure) * 100) : 0;

  const rpmFactor = ratedRpm > 0 && rpm > 0 ? ratedRpm / rpm : 1;

  const correctedFlow =
    rpm > 0 && ratedRpm > 0 ? round1(actualFlow * rpmFactor) : actualFlow;

  const correctedPressure =
    rpm > 0 && ratedRpm > 0
      ? round1(netPressure * rpmFactor * rpmFactor)
      : netPressure;

  const warnings: string[] = [];

  if (ratedFlow <= 0) warnings.push("Rated flow غير مدخل.");
  if (ratedPressure <= 0) warnings.push("Rated pressure غير مدخل.");
  if (dischargePressure <= 0) warnings.push("ضغط الطرد غير مدخل.");
  if (input.point_type !== "churn" && actualFlow <= 0) {
    warnings.push("التدفق الفعلي غير مدخل.");
  }
  if (netPressure <= 0) warnings.push("صافي ضغط المضخة غير منطقي.");
  if (ratedRpm > 0 && rpm <= 0) {
    warnings.push("RPM غير مدخل، لذلك المقارنة قد لا تكون دقيقة.");
  }

  let result: PumpPointCalculated["result"] = "pass";

  if (warnings.length > 0) {
    result = "incomplete";
  }

  const point = String(input.point_type || "").toLowerCase();

  if (point === "churn") {
    if (percentRatedPressure > 140) {
      result = "warning";
      warnings.push("Churn pressure مرتفع مقارنة بالضغط المقنن.");
    }
  }

  if (point === "rated_100") {
    if (percentRatedPressure > 0 && percentRatedPressure < 90) {
      result = "fail";
      warnings.push("الضغط عند 100% أقل من المستوى المقبول داخليًا.");
    } else if (percentRatedPressure > 0 && percentRatedPressure < 95) {
      result = "warning";
      warnings.push("الضغط عند 100% منخفض ويحتاج مراجعة.");
    }
  }

  if (point === "rated_150") {
    if (percentRatedPressure > 0 && percentRatedPressure < 65) {
      result = "fail";
      warnings.push("الضغط عند 150% منخفض جدًا.");
    }
  }

  return {
    actual_flow_gpm: round1(actualFlow),
    net_pressure_psi: netPressure,
    percent_rated_flow: percentRatedFlow,
    percent_rated_pressure: percentRatedPressure,
    corrected_flow_gpm: round1(correctedFlow),
    corrected_pressure_psi: round1(correctedPressure),
    result,
    warnings,
  };
}

export function resultLabelAr(result: string): string {
  const map: Record<string, string> = {
    pass: "مقبول",
    warning: "يحتاج مراجعة",
    fail: "غير مقبول",
    incomplete: "غير مكتمل",
  };

  return map[String(result || "").toLowerCase()] || "غير محدد";
}

export function overallPumpResult(
  points: PumpPointCalculated[]
): "compliant" | "pass_with_remarks" | "non_compliant" | "incomplete" {
  if (points.length === 0) return "incomplete";
  if (points.some((p) => p.result === "incomplete")) return "incomplete";
  if (points.some((p) => p.result === "fail")) return "non_compliant";
  if (points.some((p) => p.result === "warning")) return "pass_with_remarks";
  return "compliant";
}
