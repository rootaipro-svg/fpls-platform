import { readSheet } from "./sheets";

type ChecklistOptions = {
  visitType?: string;
  visitProfile?: string;
};

function clean(value: any) {
  return String(value ?? "").trim();
}

function norm(value: any) {
  return clean(value).toLowerCase().replace(/[\s-]+/g, "_");
}

function toNumberOrBlank(value: any) {
  const n = Number(value);
  return Number.isFinite(n) ? n : "";
}

function isFalse(value: any) {
  return ["false", "0", "no", "disabled", "inactive"].includes(norm(value));
}

function isPumpSystem(systemCode: string) {
  const code = norm(systemCode);

  return (
    code === "fp_diesel_pump" ||
    code === "fp_elec_pump" ||
    code === "fp_jockey" ||
    code.includes("pump")
  );
}

function driverForSystem(systemCode: string) {
  const code = norm(systemCode);

  if (code.includes("diesel")) return "diesel";
  if (code.includes("elec") || code.includes("electric")) return "electric";
  if (code.includes("jockey")) return "jockey";

  return "all";
}

function resolvePumpProfile(
  systemCode: string,
  visitTypeRaw: string,
  visitProfileRaw: string
) {
  const code = norm(systemCode);
  const visitType = norm(visitTypeRaw || "routine");
  const explicitProfile = norm(visitProfileRaw || "");

  if (explicitProfile) return explicitProfile;

  if (code === "fp_jockey") {
    return "jockey_routine";
  }

  if (
    ["annual", "annual_flow", "flow_test", "performance_test"].includes(
      visitType
    )
  ) {
    return "annual_flow";
  }

  if (code === "fp_diesel_pump") {
    if (["weekly", "weekly_churn"].includes(visitType)) {
      return "diesel_weekly_churn";
    }

    if (["monthly", "monthly_churn", "routine"].includes(visitType)) {
      return "diesel_weekly_churn";
    }

    return "diesel_weekly_churn";
  }

  if (code === "fp_elec_pump") {
    if (["weekly", "weekly_churn"].includes(visitType)) {
      return "electric_monthly_churn";
    }

    if (["monthly", "monthly_churn", "routine"].includes(visitType)) {
      return "electric_monthly_churn";
    }

    return "electric_monthly_churn";
  }

  return "pump_basic";
}

function allowedProfilesForVisit(
  systemCode: string,
  visitTypeRaw: string,
  visitProfileRaw: string
) {
  const visitType = norm(visitTypeRaw || "routine");
  const profiles = new Set<string>();

  profiles.add("all");
  profiles.add("any");

  if (!isPumpSystem(systemCode)) {
    profiles.add(visitType);
    profiles.add(norm(visitProfileRaw || ""));
    profiles.add("routine");
    return profiles;
  }

  const pumpProfile = resolvePumpProfile(systemCode, visitTypeRaw, visitProfileRaw);

  profiles.add("pump_basic");
  profiles.add(pumpProfile);

  return profiles;
}

function frequencyMatches(row: any, systemCode: string, visitTypeRaw: string) {
  const frequency = norm(row.frequency_code || "");
  const visitType = norm(visitTypeRaw || "routine");

  if (!frequency || frequency === "all" || frequency === "any") return true;

  if (!isPumpSystem(systemCode)) {
    return frequency === visitType || visitType === "routine";
  }

  if (visitType === "annual" || visitType === "annual_flow") {
    return frequency === "annual" || frequency === "routine";
  }

  if (visitType === "monthly" || visitType === "monthly_churn") {
    return (
      frequency === "monthly" ||
      frequency === "weekly" ||
      frequency === "routine"
    );
  }

  if (visitType === "weekly" || visitType === "weekly_churn") {
    return frequency === "weekly" || frequency === "routine";
  }

  if (visitType === "routine") {
    return (
      frequency === "routine" ||
      frequency === "weekly" ||
      frequency === "monthly"
    );
  }

  return frequency === visitType;
}

function driverMatches(row: any, systemCode: string) {
  const appliesToDriver = norm(row.applies_to_driver || "all");
  const driver = driverForSystem(systemCode);

  if (!appliesToDriver || appliesToDriver === "all" || appliesToDriver === "any") {
    return true;
  }

  return appliesToDriver === driver;
}

function itemMatchesVisit(row: any, systemCode: string, options: ChecklistOptions) {
  const visitType = clean(options.visitType || "routine");
  const visitProfile = clean(options.visitProfile || "");
  const isPump = isPumpSystem(systemCode);

  const rowProfile = norm(row.visit_profile || "");
  const allowedProfiles = allowedProfilesForVisit(
    systemCode,
    visitType,
    visitProfile
  );

  if (isPump) {
    if (!rowProfile) return false;
    if (!allowedProfiles.has(rowProfile)) return false;
  } else {
    if (rowProfile && !allowedProfiles.has(rowProfile)) return false;
  }

  if (!frequencyMatches(row, systemCode, visitType)) return false;
  if (!driverMatches(row, systemCode)) return false;

  return true;
}

export async function getChecklistForSystem(
  spreadsheetId: string,
  systemCode: string,
  options: ChecklistOptions = {}
) {
  const items = await readSheet(spreadsheetId, "CHECKLIST_TEMPLATES");

  return items
    .filter((i: any) => {
      const sameSystem = clean(i.system_code) === clean(systemCode);
      const enabled = !isFalse(i.enabled);

      if (!sameSystem || !enabled) return false;

      return itemMatchesVisit(i, systemCode, options);
    })
    .sort(
      (a: any, b: any) =>
        Number(a.item_order || 9999) - Number(b.item_order || 9999)
    )
    .map((i: any) => ({
      ...i,

      system_code: clean(i.system_code),
      checklist_item_id: clean(i.checklist_item_id),
      item_code: clean(i.item_code || i.checklist_item_id),

      section_name: clean(i.section_name),
      section_name_ar: clean(i.section_name_ar || i.section_name),

      question_text: clean(i.question_text || i.question_text_ar),
      question_text_ar: clean(i.question_text_ar || i.question_text),

      acceptance_criteria: clean(i.acceptance_criteria),
      acceptance_criteria_ar: clean(
        i.acceptance_criteria_ar || i.acceptance_criteria
      ),

      response_type_v2: clean(i.response_type_v2 || "pass_fail_na").toLowerCase(),

      numeric_unit: clean(i.numeric_unit),
      target_min: toNumberOrBlank(i.target_min),
      target_max: toNumberOrBlank(i.target_max),
      calc_rule: clean(i.calc_rule).toUpperCase(),

      ui_hint_ar: clean(i.ui_hint_ar),
      severity_default: clean(
        i.severity_default || i.finding_severity_default || "major"
      ).toLowerCase(),

      evidence_required: norm(i.evidence_required) === "true",
      photo_required: norm(i.photo_required) === "true",

      frequency_code: clean(i.frequency_code),
      activity_type: clean(i.activity_type),
      applies_to_driver: clean(i.applies_to_driver || "all"),
      requires_pump_curve: norm(i.requires_pump_curve) === "true",
      visit_profile: clean(i.visit_profile),
      evidence_rule: clean(i.evidence_rule),
      smart_rule: clean(i.smart_rule),

      item_order: Number(i.item_order || 9999),
    }));
}
