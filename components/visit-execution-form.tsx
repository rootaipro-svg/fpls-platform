"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ChecklistItemEvidence from "@/components/checklist-item-evidence";
import { evaluateSmartChecklist } from "@/lib/smart-checklist";
import {
  compareWithAssetBaseline,
  findAssetBaseline,
  type AssetBaselineRow,
} from "@/lib/asset-baseline";

type VisitSystem = {
  visit_system_id: string;
  building_system_id: string;
  system_code: string;
};

type ChecklistItem = {
  visit_system_id: string;
  building_system_id: string;
  system_code: string;
  checklist_item_id: string;
  item_code: string;
  section_name: string;
  question_text: string;
  acceptance_criteria: string;
  response_type_v2: string;
  numeric_unit: string;
  target_min: string;
  target_max: string;
  calc_rule: string;
  ui_hint_ar: string;
  severity_default: string;
  evidence_required: boolean;
  photo_required: boolean;
};

type ExistingResponse = {
  visit_system_id: string;
  checklist_item_id: string;
  response_value: string;
  finding_severity: string;
  comments: string;
  numeric_value?: string;
  numeric_value_2?: string;
  numeric_value_3?: string;
  numeric_unit?: string;
  calc_rule?: string;
  calc_result_text?: string;
  auto_judgement?: string;
};

type EvidenceRow = {
  evidence_id: string;
  visit_id: string;
  visit_system_id: string;
  checklist_item_id: string;
  asset_id?: string;
  evidence_type: string;
  file_url: string;
  file_name: string;
  caption: string;
  taken_by: string;
  taken_at: string;
};

type ActiveAsset = {
  asset_id: string;
  asset_code: string;
  asset_name: string;
  asset_name_ar: string;
  system_code: string;
  location_note: string;
  visit_system_id: string;
};

type Props = {
  visitId: string;
  visitSystems: VisitSystem[];
  checklistItems: ChecklistItem[];
  existingResponses: ExistingResponse[];
  existingEvidence: EvidenceRow[];
  activeAsset?: ActiveAsset | null;
  assetBaselines: AssetBaselineRow[];
  isReadOnly?: boolean;
};

type ItemState = {
  response_value: string;
  finding_severity: string;
  comments: string;
  corrective_action: string;
  numeric_value: string;
  numeric_value_2: string;
  numeric_value_3: string;
  numeric_unit: string;
  auto_judgement: string;
  calc_result_text: string;
};

const SECTION_LABELS: Record<string, string> = {
  approvals: "الاعتمادات واللوحات",
  "pump room": "غرفة المضخة",
  operation: "التشغيل",
  "testing and performance": "الاختبار والأداء",
  installation: "التركيب",
  documentation: "التوثيق",
};

const QUESTION_LABELS: Record<string, string> = {
  "Are the pump, driver, controller and accessories listed/approved with visible nameplates?":
    "هل المضخة والمحرك ووحدة التحكم والملحقات معتمدة ومثبتة عليها لوحات تعريف واضحة؟ (Nameplates / Listing)",
  "Is the pump room accessible, clean, illuminated and free from storage?":
    "هل غرفة المضخة سهلة الوصول ونظيفة ومضاءة وخالية من التخزين؟ (Pump Room Condition)",
  "Are suction and discharge pressure gauges installed, readable, and appropriately ranged?":
    "هل عدادات ضغط السحب والطرد مركبة وواضحة والمدى مناسب؟ (Suction / Discharge Gauges)",
  "Is a listed flow meter installed for each fire pump where required?":
    "هل يوجد مقياس تدفق معتمد ومركب لكل مضخة حريق عند الحاجة؟ (Flow Meter)",
  "Are isolation valves locked/open, supervised, and free from tampering?":
    "هل صمامات العزل في الوضع الطبيعي الصحيح ومراقبة وخالية من العبث؟ (Isolation Valves)",
  "Is pump installation arrangement acceptable for the suction condition?":
    "هل ترتيب تركيب المضخة مناسب لحالة السحب؟ (Installation / Suction Condition)",
  "Did the controller indicate normal status with no unresolved alarms or trouble?":
    "هل لوحة التحكم تظهر حالة طبيعية بدون إنذارات أو أعطال غير معالجة؟ (Controller Status)",
  "Was the weekly churn/auto-run test completed with acceptable readings?":
    "هل تم تنفيذ اختبار التشغيل الأسبوعي بدون حمل وكانت القراءات مقبولة؟ (Weekly Churn / Auto-Run Test)",
  "Record annual performance test reference readings if available.":
    "سجّل القراءات المرجعية لاختبار الأداء السنوي إن كانت متوفرة. (Annual Performance Reference)",
};

const CRITERIA_LABELS: Record<string, string> = {
  "Each major component has acceptable listing/approval and readable identification.":
    "كل مكوّن رئيسي يجب أن يكون معتمدًا وعليه تعريف واضح ومقروء.",
  "Room remains dedicated to fire protection equipment and safe operation.":
    "تبقى الغرفة مخصصة لمعدات الحريق وآمنة للتشغيل وخالية من العوائق.",
  "Gauges installed, legible, undamaged, and correctly ranged.":
    "العدادات مركبة ومقروءة وغير متضررة والمدى مناسب.",
  "Flow meter present, accessible, and not bypassed.":
    "مقياس التدفق موجود وسهل الوصول وغير متجاوز.",
  "Valves in required normal position and supervised.":
    "الصمامات في الوضع الطبيعي المطلوب وتحت المراقبة.",
  "Installation matches approved arrangement and no prohibited negative suction arrangement exists.":
    "ترتيب التركيب مطابق للوضع المعتمد ولا يوجد ترتيب سحب سلبي غير مسموح.",
  "Controller normal, no unresolved abnormal condition.":
    "لوحة التحكم طبيعية ولا توجد حالة غير طبيعية غير معالجة.",
  "Test completed and readings are within acceptable trend.":
    "تم تنفيذ الاختبار والقراءات ضمن الاتجاه أو المرجع المقبول.",
  "Current annual performance documentation available.":
    "التوثيق الحالي لاختبار الأداء السنوي متوفر عند الحاجة.",
};

function normalizeKey(value: string) {
  return String(value || "").trim().toLowerCase();
}

function toArabicSectionName(value: string) {
  const normalized = normalizeKey(value);
  return SECTION_LABELS[normalized] || value || "قسم عام";
}

function toArabicQuestionText(value: string) {
  return QUESTION_LABELS[String(value || "").trim()] || value || "بند فحص";
}

function toArabicCriteriaText(value: string) {
  return CRITERIA_LABELS[String(value || "").trim()] || value || "";
}

function toArabicResponseValue(value: string) {
  const v = String(value || "").toLowerCase();
  if (v === "compliant") return "مطابق";
  if (v === "non_compliant") return "غير مطابق";
  if (v === "not_applicable") return "غير منطبق";
  return value || "بانتظار الإجابة";
}

function itemKey(visitSystemId: string, checklistItemId: string) {
  return `${visitSystemId}__${checklistItemId}`;
}

function defaultItemState(item?: ChecklistItem): ItemState {
  return {
    response_value: "",
    finding_severity: "",
    comments: "",
    corrective_action: "",
    numeric_value: "",
    numeric_value_2: "",
    numeric_value_3: "",
    numeric_unit: String(item?.numeric_unit || ""),
    auto_judgement: "",
    calc_result_text: "",
  };
}

function isSmartItem(item: ChecklistItem) {
  return (
    Boolean(String(item.calc_rule || "").trim()) ||
    String(item.response_type_v2 || "").toLowerCase() === "numeric_range"
  );
}

function compactButtonClass(active: boolean, tone: "green" | "red" | "slate") {
  const base =
    "inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold transition min-w-[92px]";
  if (!active) {
    return `${base} border-slate-200 bg-white text-slate-800`;
  }
  if (tone === "green") {
    return `${base} border-emerald-200 bg-emerald-50 text-emerald-700`;
  }
  if (tone === "red") {
    return `${base} border-rose-200 bg-rose-50 text-rose-700`;
  }
  return `${base} border-slate-300 bg-slate-100 text-slate-800`;
}

function targetText(item: ChecklistItem) {
  const minRaw = String(item.target_min || "").trim();
  const maxRaw = String(item.target_max || "").trim();
  const unit = String(item.numeric_unit || "");

  if (!minRaw && !maxRaw) return "";

  const minNum = Number(minRaw);
  const maxNum = Number(maxRaw);
  if (minRaw && maxRaw && minNum === 0 && maxNum === 0) return "";

  if (minRaw && maxRaw) {
    return `${minRaw} - ${maxRaw}${unit ? ` ${unit}` : ""}`;
  }
  if (minRaw) return `≥ ${minRaw}${unit ? ` ${unit}` : ""}`;
  if (maxRaw) return `≤ ${maxRaw}${unit ? ` ${unit}` : ""}`;
  return "";
}

function primaryLabel(item: ChecklistItem) {
  if (String(item.calc_rule) === "EMERGENCY_LIGHT_DURATION") return "المدة الفعلية";
  if (String(item.calc_rule) === "PRESSURE_SETPOINTS") return "ضغط تشغيل الجوكي";
  if (String(item.calc_rule) === "PRESSURE_STABILITY") return "ضغط البدء";
  if (String(item.calc_rule) === "PUMP_FLOW_ACCEPTANCE") return "ضغط الطرد الحالي";
  return "القراءة الفعلية";
}

function secondaryLabel(item: ChecklistItem) {
  if (String(item.calc_rule) === "PRESSURE_SETPOINTS") return "ضغط تشغيل المضخة الرئيسية";
  if (String(item.calc_rule) === "PRESSURE_STABILITY") return "ضغط الإيقاف";
  if (String(item.calc_rule) === "PUMP_FLOW_ACCEPTANCE") return "ضغط السحب الحالي";
  return "";
}

function thirdLabel(item: ChecklistItem) {
  if (String(item.calc_rule) === "PRESSURE_STABILITY") return "عدد مرات إعادة التشغيل";
  if (String(item.calc_rule) === "PUMP_FLOW_ACCEPTANCE") return "قراءة الأداء/التدفق إن توفرت";
  return "";
}

function mergeJudgement(...values: string[]) {
  const normalized = values
    .map((v) => String(v || "").toLowerCase())
    .filter(Boolean);

  if (normalized.includes("fail")) return "fail";
  if (normalized.includes("check")) return "check";
  if (normalized.includes("pass")) return "pass";
  return "";
}

function looksLikeImage(url: string, evidenceType: string) {
  const u = String(url || "").toLowerCase();
  if (String(evidenceType || "").toLowerCase() === "image") return true;

  return (
    u.endsWith(".jpg") ||
    u.endsWith(".jpeg") ||
    u.endsWith(".png") ||
    u.endsWith(".webp") ||
    u.includes("blob.vercel-storage.com")
  );
}

export default function VisitExecutionForm({
  visitId,
  visitSystems,
  checklistItems,
  existingResponses,
  existingEvidence,
  activeAsset,
  assetBaselines,
  isReadOnly = false,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [openEvidenceKey, setOpenEvidenceKey] = useState<string | null>(null);

  const initialMap = useMemo(() => {
    const map: Record<string, ItemState> = {};

    for (const row of existingResponses) {
      map[itemKey(row.visit_system_id, row.checklist_item_id)] = {
        response_value: String(row.response_value || ""),
        finding_severity: String(row.finding_severity || ""),
        comments: String(row.comments || ""),
        corrective_action: "",
        numeric_value: String(row.numeric_value || ""),
        numeric_value_2: String(row.numeric_value_2 || ""),
        numeric_value_3: String(row.numeric_value_3 || ""),
        numeric_unit: String(row.numeric_unit || ""),
        auto_judgement: String(row.auto_judgement || ""),
        calc_result_text: String(row.calc_result_text || ""),
      };
    }

    return map;
  }, [existingResponses]);

  const [formMap, setFormMap] = useState<Record<string, ItemState>>(initialMap);

  const orderedItems = checklistItems;

  const totalItems = orderedItems.length;
  const completedCount = orderedItems.filter((item) => {
    const state =
      formMap[itemKey(item.visit_system_id, item.checklist_item_id)] ||
      defaultItemState(item);

    return (
      String(state.response_value || "").trim() !== "" ||
      String(state.numeric_value || "").trim() !== "" ||
      String(state.numeric_value_2 || "").trim() !== "" ||
      String(state.numeric_value_3 || "").trim() !== ""
    );
  }).length;

  function getItemState(item: ChecklistItem): ItemState {
    return (
      formMap[itemKey(item.visit_system_id, item.checklist_item_id)] ||
      defaultItemState(item)
    );
  }

  function setItemState(item: ChecklistItem, nextState: ItemState) {
    const key = itemKey(item.visit_system_id, item.checklist_item_id);
    setFormMap((prev) => ({
      ...prev,
      [key]: nextState,
    }));
  }

  function updateStandardItemState(item: ChecklistItem, patch: Partial<ItemState>) {
    if (isReadOnly) return;

    const current = getItemState(item);
    const nextState: ItemState = {
      ...current,
      ...patch,
    };

    if (String(nextState.response_value || "") !== "non_compliant") {
      nextState.finding_severity = "";
    }

    setItemState(item, nextState);
  }

  function updateSmartItemState(item: ChecklistItem, patch: Partial<ItemState>) {
    if (isReadOnly) return;

    const current = getItemState(item);
    const nextState: ItemState = {
      ...current,
      ...patch,
      numeric_unit: String(item.numeric_unit || current.numeric_unit || ""),
    };

    if (String(nextState.response_value || "") === "not_applicable") {
      nextState.auto_judgement = "";
      nextState.calc_result_text = "تم تحديد البند كغير منطبق.";
      nextState.finding_severity = "";
      setItemState(item, nextState);
      return;
    }

    const smartEval = evaluateSmartChecklist({
      responseType: item.response_type_v2,
      calcRule: item.calc_rule,
      numericUnit: item.numeric_unit,
      targetMin: item.target_min,
      targetMax: item.target_max,
      numericValue: nextState.numeric_value,
      numericValue2: nextState.numeric_value_2,
      numericValue3: nextState.numeric_value_3,
    });

    const baselineEval = compareWithAssetBaseline({
      baselines: assetBaselines,
      metricCode: String(item.calc_rule || ""),
      fallbackMetricCode: String(item.item_code || ""),
      numericValue: nextState.numeric_value,
      numericValue2: nextState.numeric_value_2,
      numericValue3: nextState.numeric_value_3,
      numericUnit: item.numeric_unit,
    });

    const mergedJudgement = mergeJudgement(
      smartEval.autoJudgement,
      baselineEval.autoJudgement
    );

    let mergedResponseValue = "";
    if (mergedJudgement === "fail") {
      mergedResponseValue = "non_compliant";
    } else if (smartEval.responseValue) {
      mergedResponseValue = smartEval.responseValue;
    } else if (baselineEval.responseValue) {
      mergedResponseValue = baselineEval.responseValue;
    }

    const resultParts = [smartEval.resultTextAr, baselineEval.resultTextAr].filter(Boolean);

    nextState.response_value = String(mergedResponseValue || "");
    nextState.auto_judgement = String(mergedJudgement || "");
    nextState.calc_result_text = resultParts.join(" ");

    if (String(nextState.response_value) === "non_compliant") {
      nextState.finding_severity =
        nextState.finding_severity || item.severity_default || "major";
    } else {
      nextState.finding_severity = "";
    }

    setItemState(item, nextState);
  }

  async function handleSaveAndClose() {
    if (isReadOnly) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const rows = checklistItems.map((item) => {
        const state = getItemState(item);

        return {
          visit_system_id: String(item.visit_system_id),
          building_system_id: String(item.building_system_id || ""),
          checklist_item_id: String(item.checklist_item_id),
          item_code: String(item.item_code || ""),
          title: String(item.question_text || "Non-compliant item"),
          response_value: String(state.response_value || ""),
          finding_severity:
            String(state.finding_severity || "") ||
            (String(state.response_value) === "non_compliant"
              ? String(item.severity_default || "major")
              : ""),
          comments: String(state.comments || ""),
          corrective_action: String(state.corrective_action || ""),
          numeric_value: String(state.numeric_value || ""),
          numeric_value_2: String(state.numeric_value_2 || ""),
          numeric_value_3: String(state.numeric_value_3 || ""),
          numeric_unit: String(item.numeric_unit || state.numeric_unit || ""),
          calc_rule: String(item.calc_rule || ""),
          calc_result_text: String(state.calc_result_text || ""),
          auto_judgement: String(state.auto_judgement || ""),
          severity_default: String(item.severity_default || "major"),
          calc_payload_json: {
            numeric_value: String(state.numeric_value || ""),
            numeric_value_2: String(state.numeric_value_2 || ""),
            numeric_value_3: String(state.numeric_value_3 || ""),
            numeric_unit: String(item.numeric_unit || state.numeric_unit || ""),
            calc_rule: String(item.calc_rule || ""),
            auto_judgement: String(state.auto_judgement || ""),
            calc_result_text: String(state.calc_result_text || ""),
          },
          asset_id:
            activeAsset &&
            String(activeAsset.visit_system_id) === String(item.visit_system_id)
              ? String(activeAsset.asset_id)
              : "",
        };
      });

      const effectiveRows = rows.filter((row) => {
        const hasDecision = String(row.response_value || "").trim() !== "";
        const hasNumeric =
          String(row.numeric_value || "").trim() !== "" ||
          String(row.numeric_value_2 || "").trim() !== "" ||
          String(row.numeric_value_3 || "").trim() !== "";

        return hasDecision || hasNumeric;
      });

      if (effectiveRows.length === 0) {
        throw new Error("سجل نتيجة بند واحد على الأقل قبل الحفظ");
      }

      const res = await fetch(`/api/visits/${visitId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visit_id: visitId,
          responses: effectiveRows,
          close_visit: true,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر حفظ نتائج الزيارة");
      }

      setMessage("تم حفظ النتائج وإقفال الزيارة بنجاح");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر حفظ نتائج الزيارة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card">
      <div className="section-title">قائمة الفحص التنفيذية</div>
      <div className="section-subtitle">
        {isReadOnly
          ? "هذه الزيارة مغلقة. يمكنك مراجعة النتائج فقط."
          : "قائمة ميدانية بسيطة: نفّذ البند ثم انتقل مباشرة إلى الذي يليه."}
      </div>

      <div className="badge-wrap" style={{ marginTop: "14px" }}>
        <span className="badge">النظام: {visitSystems[0]?.system_code || "-"}</span>
        <span className="badge">إجمالي البنود: {totalItems}</span>
        <span className="badge">المكتمل: {completedCount}</span>
        <span className="badge">المتبقي: {Math.max(totalItems - completedCount, 0)}</span>
      </div>

      <div className="stack-3" style={{ marginTop: "18px" }}>
        {orderedItems.map((item, index) => {
          const state = getItemState(item);
          const currentItemKey = itemKey(item.visit_system_id, item.checklist_item_id);
          const smart = isSmartItem(item);
          const isOpenEvidence = openEvidenceKey === currentItemKey;
          const isNonCompliant = String(state.response_value) === "non_compliant";
          const baselineRow = findAssetBaseline(
            assetBaselines,
            String(item.calc_rule || ""),
            String(item.item_code || "")
          );

          const itemEvidence = existingEvidence.filter((row) => {
            const sameItem =
              String(row.visit_system_id) === String(item.visit_system_id) &&
              String(row.checklist_item_id) === String(item.checklist_item_id);

            if (!sameItem) return false;

            if (activeAsset?.asset_id) {
              return String(row.asset_id || "") === String(activeAsset.asset_id);
            }

            return true;
          });

          const previousItem = orderedItems[index - 1];
          const showSectionHeader =
            !previousItem ||
            normalizeKey(previousItem.section_name) !== normalizeKey(item.section_name);

          return (
            <div key={currentItemKey}>
              {showSectionHeader ? (
                <div
                  style={{
                    marginBottom: "10px",
                    marginTop: index === 0 ? "0" : "8px",
                    padding: "8px 4px",
                    borderBottom: "1px solid #e2e8f0",
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  {toArabicSectionName(item.section_name)}
                </div>
              ) : null}

              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "18px",
                  background: "#ffffff",
                  padding: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <div className="badge-wrap">
                    <span className="badge">#{index + 1}</span>
                    <span className="badge">{smart ? "ذكي" : "بصري"}</span>
                    {item.numeric_unit ? (
                      <span className="badge">الوحدة: {item.numeric_unit}</span>
                    ) : null}
                    {targetText(item) ? (
                      <span className="badge">المدى: {targetText(item)}</span>
                    ) : null}
                  </div>

                  <span className="badge">
                    {toArabicResponseValue(state.response_value)}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "22px",
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.8,
                  }}
                >
                  {toArabicQuestionText(item.question_text)}
                </div>

                {item.acceptance_criteria ? (
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "15px",
                      color: "#475569",
                      lineHeight: 1.9,
                    }}
                  >
                    {toArabicCriteriaText(item.acceptance_criteria)}
                  </div>
                ) : null}

                {!smart ? (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                      marginTop: "14px",
                    }}
                  >
                    <button
                      type="button"
                      disabled={isReadOnly}
                      className={compactButtonClass(
                        state.response_value === "compliant",
                        "green"
                      )}
                      onClick={() =>
                        updateStandardItemState(item, {
                          response_value: "compliant",
                          finding_severity: "",
                        })
                      }
                    >
                      مطابق
                    </button>

                    <button
                      type="button"
                      disabled={isReadOnly}
                      className={compactButtonClass(
                        state.response_value === "non_compliant",
                        "red"
                      )}
                      onClick={() =>
                        updateStandardItemState(item, {
                          response_value: "non_compliant",
                          finding_severity:
                            state.finding_severity ||
                            item.severity_default ||
                            "major",
                        })
                      }
                    >
                      غير مطابق
                    </button>

                    <button
                      type="button"
                      disabled={isReadOnly}
                      className={compactButtonClass(
                        state.response_value === "not_applicable",
                        "slate"
                      )}
                      onClick={() =>
                        updateStandardItemState(item, {
                          response_value: "not_applicable",
                          finding_severity: "",
                        })
                      }
                    >
                      غير منطبق
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: "14px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      padding: "12px",
                      background: "#fafafa",
                    }}
                  >
                    <div style={{ display: "grid", gap: "10px" }}>
                      <div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#64748b",
                            marginBottom: "6px",
                          }}
                        >
                          {primaryLabel(item)}
                        </div>
                        <input
                          className="field"
                          type="number"
                          inputMode="decimal"
                          placeholder="أدخل القراءة"
                          value={state.numeric_value}
                          disabled={isReadOnly}
                          onChange={(e) =>
                            updateSmartItemState(item, {
                              numeric_value: e.target.value,
                            })
                          }
                        />
                      </div>

                      {secondaryLabel(item) ? (
                        <div>
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#64748b",
                              marginBottom: "6px",
                            }}
                          >
                            {secondaryLabel(item)}
                          </div>
                          <input
                            className="field"
                            type="number"
                            inputMode="decimal"
                            placeholder="أدخل القراءة"
                            value={state.numeric_value_2}
                            disabled={isReadOnly}
                            onChange={(e) =>
                              updateSmartItemState(item, {
                                numeric_value_2: e.target.value,
                              })
                            }
                          />
                        </div>
                      ) : null}

                      {thirdLabel(item) ? (
                        <div>
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#64748b",
                              marginBottom: "6px",
                            }}
                          >
                            {thirdLabel(item)}
                          </div>
                          <input
                            className="field"
                            type="number"
                            inputMode="decimal"
                            placeholder="أدخل القراءة"
                            value={state.numeric_value_3}
                            disabled={isReadOnly}
                            onChange={(e) =>
                              updateSmartItemState(item, {
                                numeric_value_3: e.target.value,
                              })
                            }
                          />
                        </div>
                      ) : null}
                    </div>

                    {!isReadOnly ? (
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                          marginTop: "10px",
                        }}
                      >
                        <button
                          type="button"
                          className={compactButtonClass(
                            state.response_value === "not_applicable",
                            "slate"
                          )}
                          onClick={() =>
                            updateSmartItemState(item, {
                              response_value: "not_applicable",
                            })
                          }
                        >
                          غير منطبق
                        </button>

                        <button
                          type="button"
                          className={compactButtonClass(false, "slate")}
                          onClick={() => setItemState(item, defaultItemState(item))}
                        >
                          مسح
                        </button>
                      </div>
                    ) : null}

                    {baselineRow ? (
                      <div
                        style={{
                          marginTop: "10px",
                          border: "1px solid #fcd34d",
                          background: "#fffbeb",
                          color: "#92400e",
                          borderRadius: "12px",
                          padding: "9px 10px",
                          fontSize: "13px",
                          lineHeight: 1.8,
                        }}
                      >
                        مرجع الأصل:
                        {baselineRow.ref_value ? ` ${baselineRow.ref_value}` : ""}
                        {baselineRow.ref_value_2 ? ` / ${baselineRow.ref_value_2}` : ""}
                        {baselineRow.ref_value_3 ? ` / ${baselineRow.ref_value_3}` : ""}
                        {baselineRow.metric_unit ? ` ${baselineRow.metric_unit}` : ""}
                      </div>
                    ) : null}

                    {state.calc_result_text ? (
                      <div
                        style={{
                          marginTop: "10px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          padding: "10px 12px",
                          background:
                            state.auto_judgement === "fail"
                              ? "#fef2f2"
                              : state.auto_judgement === "pass"
                              ? "#ecfdf5"
                              : "#f8fafc",
                          color:
                            state.auto_judgement === "fail"
                              ? "#b91c1c"
                              : state.auto_judgement === "pass"
                              ? "#047857"
                              : "#334155",
                          fontSize: "13px",
                          lineHeight: 1.8,
                        }}
                      >
                        {state.calc_result_text}
                      </div>
                    ) : null}
                  </div>
                )}

                {isNonCompliant && !isReadOnly ? (
                  <div
                    style={{
                      marginTop: "12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      padding: "12px",
                      background: "#fcfcfd",
                    }}
                  >
                    <select
                      className="field"
                      value={state.finding_severity}
                      onChange={(e) =>
                        updateStandardItemState(item, {
                          finding_severity: e.target.value,
                        })
                      }
                    >
                      <option value="">اختر الشدة</option>
                      <option value="critical">حرج</option>
                      <option value="major">مرتفع</option>
                      <option value="minor">منخفض</option>
                    </select>

                    <textarea
                      className="field"
                      placeholder="ملاحظات المفتش"
                      value={state.comments}
                      onChange={(e) =>
                        updateStandardItemState(item, {
                          comments: e.target.value,
                        })
                      }
                      style={{ marginTop: "10px" }}
                    />

                    <textarea
                      className="field"
                      placeholder="الإجراء التصحيحي المقترح"
                      value={state.corrective_action}
                      onChange={(e) =>
                        updateStandardItemState(item, {
                          corrective_action: e.target.value,
                        })
                      }
                      style={{ marginTop: "10px" }}
                    />
                  </div>
                ) : null}

                <div
                  style={{
                    marginTop: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      setOpenEvidenceKey(
                        isOpenEvidence ? null : currentItemKey
                      )
                    }
                  >
                    {itemEvidence.length > 0
                      ? `الدليل (${itemEvidence.length})`
                      : "الدليل"}
                  </button>

                  <span className="badge">
                    {String(state.response_value || "").trim()
                      ? "تمت الإجابة"
                      : "بانتظار الإجابة"}
                  </span>
                </div>

                {isOpenEvidence ? (
                  <div
                    style={{
                      marginTop: "12px",
                      borderTop: "1px dashed #cbd5e1",
                      paddingTop: "12px",
                    }}
                  >
                    {isReadOnly ? (
                      itemEvidence.length === 0 ? (
                        <div className="muted-note">لا توجد أدلة محفوظة لهذا البند.</div>
                      ) : (
                        <div className="stack-3">
                          {itemEvidence.map((row) => (
                            <div
                              key={String(row.evidence_id)}
                              style={{
                                border: "1px solid #e2e8f0",
                                borderRadius: "14px",
                                padding: "12px",
                                background: "#ffffff",
                              }}
                            >
                              <div className="badge-wrap">
                                <span className="badge">
                                  {String(row.evidence_type || "evidence")}
                                </span>
                                {row.file_name ? (
                                  <span className="badge">{String(row.file_name)}</span>
                                ) : null}
                              </div>

                              {looksLikeImage(
                                String(row.file_url || ""),
                                String(row.evidence_type || "")
                              ) ? (
                                <div style={{ marginTop: "10px" }}>
                                  <img
                                    src={String(row.file_url || "")}
                                    alt={String(row.file_name || "Evidence")}
                                    style={{
                                      width: "100%",
                                      borderRadius: "12px",
                                      border: "1px solid #e2e8f0",
                                    }}
                                  />
                                </div>
                              ) : row.file_url ? (
                                <div style={{ marginTop: "10px" }}>
                                  <a
                                    href={String(row.file_url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-secondary"
                                  >
                                    فتح الملف
                                  </a>
                                </div>
                              ) : null}

                              {row.caption ? (
                                <div className="section-subtitle" style={{ marginTop: "10px" }}>
                                  {String(row.caption)}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      <ChecklistItemEvidence
                        visitId={visitId}
                        visitSystemId={String(item.visit_system_id)}
                        checklistItemId={String(item.checklist_item_id)}
                        assetId={activeAsset?.asset_id || ""}
                        rows={itemEvidence}
                      />
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {message ? (
        <div className="alert-success" style={{ marginTop: "16px" }}>
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="alert-error" style={{ marginTop: "16px" }}>
          {error}
        </div>
      ) : null}

      {!isReadOnly ? (
        <div style={{ marginTop: "16px" }}>
          <button
            type="button"
            className="btn btn-grow"
            onClick={handleSaveAndClose}
            disabled={saving}
          >
            {saving ? "جارٍ الحفظ..." : "حفظ النتائج وإقفال الزيارة"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
