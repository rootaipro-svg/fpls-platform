export type SmartEvaluationInput = {
  responseType?: string;
  calcRule?: string;
  numericUnit?: string;
  targetMin?: string | number | null;
  targetMax?: string | number | null;
  numericValue?: string | number | null;
  numericValue2?: string | number | null;
  numericValue3?: string | number | null;
};

export type SmartEvaluationResult = {
  responseValue: string;
  autoJudgement: string;
  resultTextAr: string;
};

function toNumber(value: any): number | null {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

function withUnit(value: number, unit: string) {
  return `${formatNumber(value)}${unit ? ` ${unit}` : ""}`;
}

function emptyResult(): SmartEvaluationResult {
  return {
    responseValue: "",
    autoJudgement: "",
    resultTextAr: "",
  };
}

function buildRangeDescription(
  value: number,
  unit: string,
  targetMin: number | null,
  targetMax: number | null
) {
  const valueText = withUnit(value, unit);

  if (targetMin !== null && targetMax !== null) {
    return `القراءة ${valueText} والمجال المطلوب من ${formatNumber(targetMin)} إلى ${formatNumber(targetMax)}${unit ? ` ${unit}` : ""}.`;
  }

  if (targetMin !== null) {
    return `القراءة ${valueText} والحد الأدنى المطلوب ${formatNumber(targetMin)}${unit ? ` ${unit}` : ""}.`;
  }

  if (targetMax !== null) {
    return `القراءة ${valueText} والحد الأعلى المسموح ${formatNumber(targetMax)}${unit ? ` ${unit}` : ""}.`;
  }

  return `القراءة المسجلة ${valueText}.`;
}

function evaluateNumericRange(input: SmartEvaluationInput): SmartEvaluationResult {
  const value = toNumber(input.numericValue);
  const targetMin = toNumber(input.targetMin);
  const targetMax = toNumber(input.targetMax);
  const unit = String(input.numericUnit || "");

  if (value === null) return emptyResult();

  let pass = true;

  if (targetMin !== null && value < targetMin) {
    pass = false;
  }

  if (targetMax !== null && value > targetMax) {
    pass = false;
  }

  return {
    responseValue: pass ? "compliant" : "non_compliant",
    autoJudgement: pass ? "pass" : "fail",
    resultTextAr: buildRangeDescription(value, unit, targetMin, targetMax),
  };
}

function evaluateEmergencyLightDuration(
  input: SmartEvaluationInput
): SmartEvaluationResult {
  return evaluateNumericRange({
    ...input,
    numericUnit: input.numericUnit || "دقيقة",
  });
}

function evaluatePressureSetpoints(
  input: SmartEvaluationInput
): SmartEvaluationResult {
  const jockeyStart = toNumber(input.numericValue);
  const mainStart = toNumber(input.numericValue2);
  const unit = String(input.numericUnit || "psi");

  if (jockeyStart === null || mainStart === null) {
    return emptyResult();
  }

  const pass = mainStart < jockeyStart;

  return {
    responseValue: pass ? "compliant" : "non_compliant",
    autoJudgement: pass ? "pass" : "fail",
    resultTextAr: pass
      ? `تسلسل الضغوط صحيح: ضغط تشغيل الجوكي ${withUnit(jockeyStart, unit)} وضغط تشغيل المضخة الرئيسية ${withUnit(mainStart, unit)}.`
      : `تسلسل الضغوط غير صحيح: يجب أن يبدأ الجوكي أولًا عند ضغط أعلى من المضخة الرئيسية. الحالي: الجوكي ${withUnit(jockeyStart, unit)} / الرئيسية ${withUnit(mainStart, unit)}.`,
  };
}

function evaluatePressureStability(
  input: SmartEvaluationInput
): SmartEvaluationResult {
  const startPressure = toNumber(input.numericValue);
  const stopPressure = toNumber(input.numericValue2);
  const restarts = toNumber(input.numericValue3);
  const unit = String(input.numericUnit || "psi");

  if (startPressure === null || stopPressure === null) {
    return emptyResult();
  }

  if (stopPressure <= startPressure) {
    return {
      responseValue: "non_compliant",
      autoJudgement: "fail",
      resultTextAr: `ضغط الإيقاف ${withUnit(stopPressure, unit)} يجب أن يكون أعلى من ضغط البدء ${withUnit(startPressure, unit)}.`,
    };
  }

  if (restarts !== null && restarts >= 3) {
    return {
      responseValue: "non_compliant",
      autoJudgement: "fail",
      resultTextAr: `يوجد احتمال عدم استقرار أو short cycling لأن عدد مرات إعادة التشغيل ${formatNumber(restarts)}.`,
    };
  }

  if (restarts !== null && restarts === 2) {
    return {
      responseValue: "non_compliant",
      autoJudgement: "check",
      resultTextAr: `الضغوط متسلسلة لكن عدد مرات إعادة التشغيل ${formatNumber(restarts)} ويحتاج مراجعة ميدانية.`,
    };
  }

  return {
    responseValue: "compliant",
    autoJudgement: "pass",
    resultTextAr: `الاستقرار مقبول: ضغط البدء ${withUnit(startPressure, unit)}، وضغط الإيقاف ${withUnit(stopPressure, unit)}${restarts !== null ? `، وعدد الإعادات ${formatNumber(restarts)}` : ""}.`,
  };
}

function evaluatePumpFlowAcceptance(
  input: SmartEvaluationInput
): SmartEvaluationResult {
  const dischargePressure = toNumber(input.numericValue);
  const suctionPressure = toNumber(input.numericValue2);
  const flowReading = toNumber(input.numericValue3);
  const unit = String(input.numericUnit || "psi");

  if (dischargePressure === null || suctionPressure === null) {
    return emptyResult();
  }

  const pass = dischargePressure > suctionPressure;

  let text = pass
    ? `ضغط الطرد الحالي ${withUnit(dischargePressure, unit)} وضغط السحب الحالي ${withUnit(suctionPressure, unit)}.`
    : `ضغط الطرد الحالي ${withUnit(dischargePressure, unit)} وضغط السحب الحالي ${withUnit(suctionPressure, unit)}، ويجب أن تكون قراءة ضغط الطرد أعلى من ضغط السحب.`;

  if (flowReading !== null) {
    text += ` قراءة الأداء/التدفق الحالية ${formatNumber(flowReading)}.`;
  }

  return {
    responseValue: pass ? "compliant" : "non_compliant",
    autoJudgement: pass ? "pass" : "fail",
    resultTextAr: text,
  };
}

export function evaluateSmartChecklist(
  input: SmartEvaluationInput
): SmartEvaluationResult {
  const calcRule = String(input.calcRule || "").trim().toUpperCase();
  const responseType = String(input.responseType || "").trim().toLowerCase();

  if (calcRule === "EMERGENCY_LIGHT_DURATION") {
    return evaluateEmergencyLightDuration(input);
  }

  if (calcRule === "PRESSURE_SETPOINTS") {
    return evaluatePressureSetpoints(input);
  }

  if (calcRule === "PRESSURE_STABILITY") {
    return evaluatePressureStability(input);
  }

  if (calcRule === "PUMP_FLOW_ACCEPTANCE") {
    return evaluatePumpFlowAcceptance(input);
  }

  if (responseType === "numeric_range") {
    return evaluateNumericRange(input);
  }

  return emptyResult();
}
