export type AssetBaselineRow = {
  baseline_id: string;
  tenant_id: string;
  asset_id: string;
  system_code: string;
  baseline_profile_code: string;
  metric_code: string;
  metric_name_ar: string;
  metric_unit: string;
  ref_value: string;
  ref_value_2: string;
  ref_value_3: string;
  low_limit: string;
  high_limit: string;
  allowed_dev_abs: string;
  allowed_dev_pct: string;
  compare_mode: string;
  baseline_date: string;
  baseline_source: string;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type AssetBaselineCompareResult = {
  hasBaseline: boolean;
  responseValue: string;
  autoJudgement: string;
  resultTextAr: string;
};

function toNumber(value: any): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function fmt(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.00$/, "");
}

function withinAbs(value: number, ref: number, allowedAbs: number | null) {
  if (allowedAbs === null) return true;
  return Math.abs(value - ref) <= allowedAbs;
}

function withinPct(value: number, ref: number, allowedPct: number | null) {
  if (allowedPct === null) return true;
  if (ref === 0) return true;
  return (Math.abs(value - ref) / Math.abs(ref)) * 100 <= allowedPct;
}

export function findAssetBaseline(
  rows: AssetBaselineRow[],
  metricCode: string,
  fallbackMetricCode = ""
) {
  const primary = String(metricCode || "").trim().toUpperCase();
  const fallback = String(fallbackMetricCode || "").trim().toUpperCase();

  return rows.find((row) => {
    const rowMetric = String(row.metric_code || "").trim().toUpperCase();
    return rowMetric === primary || (fallback && rowMetric === fallback);
  });
}

function compareScalarBaseline(
  baseline: AssetBaselineRow,
  observedValue: string | number | null | undefined,
  unitOverride = ""
): AssetBaselineCompareResult {
  const observed = toNumber(observedValue);
  if (observed === null) {
    return {
      hasBaseline: true,
      responseValue: "",
      autoJudgement: "",
      resultTextAr: "",
    };
  }

  const compareMode = String(baseline.compare_mode || "").toLowerCase();
  const unit = String(unitOverride || baseline.metric_unit || "");
  const refValue = toNumber(baseline.ref_value);
  const lowLimit = toNumber(baseline.low_limit);
  const highLimit = toNumber(baseline.high_limit);
  const allowedAbs = toNumber(baseline.allowed_dev_abs);
  const allowedPct = toNumber(baseline.allowed_dev_pct);

  let pass = true;
  let text = "";

  if (compareMode === "range") {
    if (lowLimit !== null && observed < lowLimit) pass = false;
    if (highLimit !== null && observed > highLimit) pass = false;

    text = `القراءة الحالية ${fmt(observed)}${unit ? ` ${unit}` : ""}، والمجال المرجعي من ${
      lowLimit !== null ? fmt(lowLimit) : "-"
    } إلى ${highLimit !== null ? fmt(highLimit) : "-"}${unit ? ` ${unit}` : ""}.`;
  } else if (compareMode === "min_only") {
    const minValue = lowLimit !== null ? lowLimit : refValue;
    if (minValue !== null && observed < minValue) pass = false;

    text = `القراءة الحالية ${fmt(observed)}${unit ? ` ${unit}` : ""}، والحد الأدنى المرجعي ${
      minValue !== null ? fmt(minValue) : "-"
    }${unit ? ` ${unit}` : ""}.`;
  } else if (compareMode === "max_only") {
    const maxValue = highLimit !== null ? highLimit : refValue;
    if (maxValue !== null && observed > maxValue) pass = false;

    text = `القراءة الحالية ${fmt(observed)}${unit ? ` ${unit}` : ""}، والحد الأعلى المرجعي ${
      maxValue !== null ? fmt(maxValue) : "-"
    }${unit ? ` ${unit}` : ""}.`;
  } else if (compareMode === "delta_pct") {
    if (refValue !== null) {
      pass = withinPct(observed, refValue, allowedPct);
      const pct =
        refValue !== 0
          ? ((Math.abs(observed - refValue) / Math.abs(refValue)) * 100).toFixed(1)
          : "0";

      text = `القراءة الحالية ${fmt(observed)}${unit ? ` ${unit}` : ""}، والمرجع ${
        fmt(refValue)
      }${unit ? ` ${unit}` : ""}، والانحراف ${pct}%.${
        allowedPct !== null ? ` الحد المسموح ${fmt(allowedPct)}%.` : ""
      }`;
    } else {
      text = `القراءة الحالية ${fmt(observed)}${unit ? ` ${unit}` : ""}.`;
    }
  } else {
    if (refValue !== null) {
      pass =
        withinAbs(observed, refValue, allowedAbs) &&
        withinPct(observed, refValue, allowedPct);

      text = `القراءة الحالية ${fmt(observed)}${unit ? ` ${unit}` : ""}، والمرجع ${
        fmt(refValue)
      }${unit ? ` ${unit}` : ""}.${
        allowedAbs !== null ? ` الانحراف المطلق المسموح ±${fmt(allowedAbs)}.` : ""
      }${
        allowedPct !== null ? ` الانحراف النسبي المسموح ${fmt(allowedPct)}%.` : ""
      }`;
    } else {
      text = `القراءة الحالية ${fmt(observed)}${unit ? ` ${unit}` : ""}.`;
    }
  }

  return {
    hasBaseline: true,
    responseValue: pass ? "compliant" : "non_compliant",
    autoJudgement: pass ? "pass" : "fail",
    resultTextAr: `مقارنة baseline: ${text}`,
  };
}

function comparePressureSetpointsBaseline(
  baseline: AssetBaselineRow,
  numericValue: string | number | null | undefined,
  numericValue2: string | number | null | undefined,
  unitOverride = ""
): AssetBaselineCompareResult {
  const jockeyStart = toNumber(numericValue);
  const mainStart = toNumber(numericValue2);

  if (jockeyStart === null || mainStart === null) {
    return {
      hasBaseline: true,
      responseValue: "",
      autoJudgement: "",
      resultTextAr: "",
    };
  }

  const refJockey = toNumber(baseline.ref_value);
  const refMain = toNumber(baseline.ref_value_2);
  const allowedAbs = toNumber(baseline.allowed_dev_abs);
  const allowedPct = toNumber(baseline.allowed_dev_pct);
  const unit = String(unitOverride || baseline.metric_unit || "psi");

  const jockeyOk =
    refJockey === null
      ? true
      : withinAbs(jockeyStart, refJockey, allowedAbs) &&
        withinPct(jockeyStart, refJockey, allowedPct);

  const mainOk =
    refMain === null
      ? true
      : withinAbs(mainStart, refMain, allowedAbs) &&
        withinPct(mainStart, refMain, allowedPct);

  const relationOk = mainStart < jockeyStart;
  const pass = jockeyOk && mainOk && relationOk;

  const parts: string[] = [
    `الجوكي الحالي ${fmt(jockeyStart)} ${unit}${
      refJockey !== null ? ` / المرجع ${fmt(refJockey)} ${unit}` : ""
    }`,
    `الرئيسية الحالية ${fmt(mainStart)} ${unit}${
      refMain !== null ? ` / المرجع ${fmt(refMain)} ${unit}` : ""
    }`,
    relationOk
      ? "تسلسل التشغيل صحيح."
      : "تسلسل التشغيل غير صحيح: يجب أن تبدأ المضخة الرئيسية عند ضغط أقل من الجوكي.",
  ];

  if (allowedAbs !== null) {
    parts.push(`الانحراف المطلق المسموح ±${fmt(allowedAbs)} ${unit}.`);
  }

  return {
    hasBaseline: true,
    responseValue: pass ? "compliant" : "non_compliant",
    autoJudgement: pass ? "pass" : "fail",
    resultTextAr: `مقارنة baseline: ${parts.join(" ")}`,
  };
}

function comparePressureStabilityBaseline(
  baseline: AssetBaselineRow,
  numericValue: string | number | null | undefined,
  numericValue2: string | number | null | undefined,
  numericValue3: string | number | null | undefined,
  unitOverride = ""
): AssetBaselineCompareResult {
  const startPressure = toNumber(numericValue);
  const stopPressure = toNumber(numericValue2);
  const restarts = toNumber(numericValue3);

  if (startPressure === null || stopPressure === null) {
    return {
      hasBaseline: true,
      responseValue: "",
      autoJudgement: "",
      resultTextAr: "",
    };
  }

  const refStart = toNumber(baseline.ref_value);
  const refStop = toNumber(baseline.ref_value_2);
  const refRestarts = toNumber(baseline.ref_value_3);
  const allowedAbs = toNumber(baseline.allowed_dev_abs);
  const allowedPct = toNumber(baseline.allowed_dev_pct);
  const unit = String(unitOverride || baseline.metric_unit || "psi");

  const startOk =
    refStart === null
      ? true
      : withinAbs(startPressure, refStart, allowedAbs) &&
        withinPct(startPressure, refStart, allowedPct);

  const stopOk =
    refStop === null
      ? true
      : withinAbs(stopPressure, refStop, allowedAbs) &&
        withinPct(stopPressure, refStop, allowedPct);

  const relationOk = stopPressure > startPressure;
  const restartOk = refRestarts === null || restarts === null ? true : restarts <= refRestarts;

  const pass = startOk && stopOk && relationOk && restartOk;

  const parts: string[] = [
    `ضغط البدء الحالي ${fmt(startPressure)} ${unit}${
      refStart !== null ? ` / المرجع ${fmt(refStart)} ${unit}` : ""
    }`,
    `ضغط الإيقاف الحالي ${fmt(stopPressure)} ${unit}${
      refStop !== null ? ` / المرجع ${fmt(refStop)} ${unit}` : ""
    }`,
    relationOk
      ? "علاقة البدء والإيقاف صحيحة."
      : "علاقة البدء والإيقاف غير صحيحة: ضغط الإيقاف يجب أن يكون أعلى من البدء.",
  ];

  if (restarts !== null) {
    parts.push(
      refRestarts !== null
        ? `عدد مرات إعادة التشغيل ${fmt(restarts)} / المرجع الأقصى ${fmt(refRestarts)}.`
        : `عدد مرات إعادة التشغيل ${fmt(restarts)}.`
    );
  }

  if (allowedAbs !== null) {
    parts.push(`الانحراف المطلق المسموح ±${fmt(allowedAbs)} ${unit}.`);
  }

  return {
    hasBaseline: true,
    responseValue: pass ? "compliant" : "non_compliant",
    autoJudgement: pass ? "pass" : "fail",
    resultTextAr: `مقارنة baseline: ${parts.join(" ")}`,
  };
}

export function compareWithAssetBaseline(input: {
  baselines: AssetBaselineRow[];
  metricCode: string;
  fallbackMetricCode?: string;
  numericValue?: string | number | null;
  numericValue2?: string | number | null;
  numericValue3?: string | number | null;
  numericUnit?: string;
}): AssetBaselineCompareResult {
  const baseline = findAssetBaseline(
    input.baselines,
    input.metricCode,
    input.fallbackMetricCode || ""
  );

  if (!baseline) {
    return {
      hasBaseline: false,
      responseValue: "",
      autoJudgement: "",
      resultTextAr: "",
    };
  }

  const metricCode = String(baseline.metric_code || "").toUpperCase();

  if (metricCode === "PRESSURE_SETPOINTS") {
    return comparePressureSetpointsBaseline(
      baseline,
      input.numericValue,
      input.numericValue2,
      input.numericUnit || ""
    );
  }

  if (metricCode === "PRESSURE_STABILITY") {
    return comparePressureStabilityBaseline(
      baseline,
      input.numericValue,
      input.numericValue2,
      input.numericValue3,
      input.numericUnit || ""
    );
  }

  return compareScalarBaseline(
    baseline,
    input.numericValue,
    input.numericUnit || ""
  );
}
