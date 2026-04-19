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
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.00$/, "");
}

function buildRangeDescription(
  value: number,
  unit: string,
  targetMin: number | null,
  targetMax: number | null
) {
  const valueText = `${formatNumber(value)}${unit ? ` ${unit}` : ""}`;

  if (targetMin !== null && targetMax !== null) {
    return `القراءة ${valueText} والمجال المطلوب من ${formatNumber(
      targetMin
    )} إلى ${formatNumber(targetMax)}${unit ? ` ${unit}` : ""}.`;
  }

  if (targetMin !== null) {
    return `القراءة ${valueText} والحد الأدنى المطلوب ${formatNumber(
      targetMin
    )}${unit ? ` ${unit}` : ""}.`;
  }

  if (targetMax !== null) {
    return `القراءة ${valueText} والحد الأعلى المسموح ${formatNumber(
      targetMax
    )}${unit ? ` ${unit}` : ""}.`;
  }

  return `القراءة المسجلة ${valueText}.`;
}

function evaluateNumericRange(input: SmartEvaluationInput): SmartEvaluationResult {
  const value = toNumber(input.numericValue);
  const targetMin = toNumber(input.targetMin);
  const targetMax = toNumber(input.targetMax);
  const unit = String(input.numericUnit || "");

  if (value === null) {
    return {
      responseValue: "",
      autoJudgement: "",
      resultTextAr: "",
    };
  }

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
    return {
      responseValue: "",
      autoJudgement: "",
      resultTextAr: "",
    };
  }

  const pass = mainStart < jockeyStart;

  return {
    responseValue: pass ? "compliant" : "non_compliant",
    autoJudgement: pass ? "pass" : "fail",
    resultTextAr: pass
      ? `تسلسل الضغوط صحيح: ضغط تشغيل الجوكي ${formatNumber(
          jockeyStart
        )} ${unit} وضغط تشغيل المضخة الرئيسية ${formatNumber(
          mainStart
        )} ${unit}.`
      : `تسلسل الضغوط غير صحيح: يجب أن يبدأ الجوكي أولًا عند ضغط أعلى من المضخة الرئيسية. الحالي: الجوكي ${formatNumber(
          jockeyStart
        )} ${unit} / الرئيسية ${formatNumber(mainStart)} ${unit}.`,
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
    return {
      responseValue: "",
      autoJudgement: "",
      resultTextAr: "",
    };
  }

  if (stopPressure <= startPressure) {
    return {
      responseValue: "non_compliant",
      autoJudgement: "fail",
      resultTextAr: `ضغط الإيقاف ${formatNumber(
        stopPressure
      )} ${unit} يجب أن يكون أعلى من ضغط البدء ${formatNumber(
        startPressure
      )} ${unit}.`,
    };
  }

  if (restarts !== null && restarts >= 3) {
    return {
      responseValue: "non_compliant",
      autoJudgement: "fail",
      resultTextAr: `يوجد احتمال عدم استقرار أو short cycling لأن عدد مرات إعادة التشغيل ${formatNumber(
        restarts
      )}.`,
    };
  }

  if (restarts !== null && restarts === 2) {
    return {
      responseValue: "non_compliant",
      autoJudgement: "check",
      resultTextAr: `الضغوط متسلسلة لكن عدد مرات إعادة التشغيل ${formatNumber(
        restarts
      )} ويحتاج مراجعة ميدانية.`,
    };
  }

  return {
    responseValue: "compliant",
    autoJudgement: "pass",
    resultTextAr: `الاستقرار مقبول: ضغط البدء ${formatNumber(
      startPressure
    )} ${unit}، وضغط الإيقاف ${formatNumber(
      stopPressure
    )} ${unit}${restarts !== null ? `، وعدد الإعادات ${formatNumber(restarts)}` : ""}.`,
  };
}

function evaluatePumpFlowAcceptance(
  input: SmartEvaluationInput
): SmartEvaluationResult {
  const discharge = toNumber(input.numericValue);
  const suction = toNumber(input.numericValue2);
  const flowReading = toNumber(input.numericValue3);
  const unit = String(input.numericUnit || "psi");
  const targetMin = toNumber(input.targetMin);
  const targetMax = toNumber(input.targetMax);

  if (discharge === null && suction === null && flowReading === null) {
    return {
      responseValue: "",
      autoJudgement: "",
      resultTextAr: "",
    };
  }

  let pass = true;
  const parts: string[] = [];

  if (discharge !== null) {
    parts.push(`ضغط الطرد الحالي ${formatNumber(discharge)} ${unit}.`);

    if (targetMin !== null && discharge < targetMin) {
      pass = false;
    }

    if (targetMax !== null && targetMax > 0 && discharge > targetMax) {
      pass = false;
    }

    if (targetMin !== null || targetMax !== null) {
      parts.push(
        `المجال المطلوب ${
          targetMin !== null ? formatNumber(targetMin) : "-"
        } إلى ${targetMax !== null ? formatNumber(targetMax) : "-"} ${
          unit || ""
        }.`
      );
    }
  }

  if (suction !== null) {
    parts.push(`ضغط السحب الحالي ${formatNumber(suction)} ${unit}.`);
  }

  if (flowReading !== null) {
    parts.push(`قراءة الأداء/التدفق الحالية ${formatNumber(flowReading)}.`);
  }

  if (discharge !== null && suction !== null && discharge <= suction) {
    pass = false;
    parts.push("قراءة ضغط الطرد يجب أن تكون أعلى من ضغط السحب.");
  }

  return {
    responseValue: pass ? "compliant" : "non_compliant",
    autoJudgement: pass ? "pass" : "fail",
    resultTextAr: parts.join(" "),
  };
}

export function evaluateSmartChecklist(
  input: SmartEvaluationInput
): SmartEvaluationResult {
  const calcRule = String(input.calcRule || "").toUpperCase();
  const responseType = String(input.responseType || "").toLowerCase();

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

  return {
    responseValue: "",
    autoJudgement: "",
    resultTextAr: "",
  };
}
