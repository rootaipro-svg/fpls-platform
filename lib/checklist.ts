import { readSheet } from "./sheets";

function toNumberOrBlank(value: any) {
  const n = Number(value);
  return Number.isFinite(n) ? n : "";
}

export async function getChecklistForSystem(
  spreadsheetId: string,
  systemCode: string
) {
  const items = await readSheet(spreadsheetId, "CHECKLIST_TEMPLATES");

  return items
    .filter(
      (i: any) =>
        String(i.system_code || "") === String(systemCode || "") &&
        String(i.enabled || "").toLowerCase() !== "false"
    )
    .sort((a: any, b: any) => Number(a.item_order || 9999) - Number(b.item_order || 9999))
    .map((i: any) => ({
      ...i,
      system_code: String(i.system_code || ""),
      checklist_item_id: String(i.checklist_item_id || ""),
      item_code: String(i.item_code || i.checklist_item_id || ""),
      section_name: String(i.section_name || ""),
      question_text: String(i.question_text || i.question_text_ar || ""),
      question_text_ar: String(i.question_text_ar || i.question_text || ""),
      acceptance_criteria: String(i.acceptance_criteria || ""),
      response_type_v2: String(i.response_type_v2 || "pass_fail_na").toLowerCase(),
      numeric_unit: String(i.numeric_unit || ""),
      target_min: toNumberOrBlank(i.target_min),
      target_max: toNumberOrBlank(i.target_max),
      calc_rule: String(i.calc_rule || "").toUpperCase(),
      ui_hint_ar: String(i.ui_hint_ar || ""),
      severity_default: String(
        i.severity_default || i.finding_severity_default || "major"
      ).toLowerCase(),
      evidence_required:
        String(i.evidence_required || "").toLowerCase() === "true",
      photo_required: String(i.photo_required || "").toLowerCase() === "true",
      item_order: Number(i.item_order || 9999),
    }));
}
