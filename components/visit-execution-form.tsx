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

function buttonClass(active: boolean, tone: "green" | "red" | "slate") {
  const base =
    "inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-base font-semibold transition min-w-[108px]";
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

function isSmartItem(item: ChecklistItem) {
  return (
    Boolean(String(item.calc_rule || "").trim()) ||
    String(item.response_type_v2 || "").toLowerCase() === "numeric_range"
  );
}

function smartBadgeText(item: ChecklistItem) {
  if (String(item.calc_rule || "").trim()) {
    return `قاعدة ذكية: ${String(item.calc_rule)}`;
  }

  if (String(item.response_type_v2 || "").toLowerCase() === "numeric_range") {
    return "إدخال رقمي";
  }

  return "";
}

function targetText(item: ChecklistItem) {
  const hasMin = String(item.target_min || "").trim() !== "";
  const hasMax = String(item.target_max || "").trim() !== "";
  const unit = String(item.numeric_unit || "");

  if (hasMin && hasMax) {
    return `المجال: ${item.target_min} - ${item.target_max}${unit ? ` ${unit}` : ""}`;
  }

  if (hasMin) {
    return `الحد الأدنى: ${item.target_min}${unit ? ` ${unit}` : ""}`;
  }

  if (hasMax) {
    return `الحد الأعلى: ${item.target_max}${unit ? ` ${unit}` : ""}`;
  }

  return "";
}

function primaryLabel(item: ChecklistItem) {
  if (String(item.calc_rule) === "EMERGENCY_LIGHT_DURATION") return "المدة الفعلية";
  if (String(item.calc_rule) === "PRESSURE_SETPOINTS") return "ضغط تشغيل الجوكي";
  if (String(item.calc_rule) === "PRESSURE_STABILITY") return "ضغط البدء";
  return "القراءة الفعلية";
}

function secondaryLabel(item: ChecklistItem) {
  if (String(item.calc_rule) === "PRESSURE_SETPOINTS") return "ضغط تشغيل المضخة الرئيسية";
  if (String(item.calc_rule) === "PRESSURE_STABILITY") return "ضغط الإيقاف";
  return "";
}

function thirdLabel(item: ChecklistItem) {
  if (String(item.calc_rule) === "PRESSURE_STABILITY") return "عدد مرات إعادة التشغيل";
  return "";
}

function mergeJudgement(...values: string[]) {
  const normalized = values.map((v) => String(v || "").toLowerCase()).filter(Boolean);

  if (normalized.includes("fail")) return "fail";
  if (normalized.includes("check")) return "check";
  if (normalized.includes("pass")) return "pass";
  return "";
}

export default function VisitExecutionForm({
  visitId,
  visitSystems,
  checklistItems,
  existingResponses,
  existingEvidence,
  activeAsset,
  assetBaselines,
}: Props) {
  const router = useRouter();

  const [selectedSystemId, setSelectedSystemId] = useState<string>(
    activeAsset?.visit_system_id || visitSystems[0]?.visit_system_id || ""
  );

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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedSystem = visitSystems.find(
    (system) => String(system.visit_system_id) === String(selectedSystemId)
  );

  const selectedItems = checklistItems.filter(
    (item) => String(item.visit_system_id) === String(selectedSystemId)
  );

  function getItemState(item: ChecklistItem): ItemState {
    return formMap[itemKey(item.visit_system_id, item.checklist_item_id)] || defaultItemState(item);
  }

  function setItemState(item: ChecklistItem, nextState: ItemState) {
    const key = itemKey(item.visit_system_id, item.checklist_item_id);

    setFormMap((prev) => ({
      ...prev,
      [key]: nextState,
    }));
  }

  function updateStandardItemState(item: ChecklistItem, patch: Partial<ItemState>) {
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

      const effectiveRows = rows.filter(
        (row) => String(row.response_value || "").trim() !== ""
      );

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
      <div className="section-title">تنفيذ الزيارة</div>
      <div className="section-subtitle">
        سجل نتائج الفحص لكل بند، وأضف الدليل مباشرة تحت البند نفسه.
      </div>

      {activeAsset ? (
        <div
          style={{
            marginTop: "14px",
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            padding: "14px",
            background: "#f8fafc",
          }}
        >
          <div className="section-title" style={{ fontSize: "15px" }}>
            فحص أصل محدد
          </div>
          <div className="section-subtitle" style={{ marginTop: "6px" }}>
            {String(activeAsset.asset_name_ar || activeAsset.asset_name || "أصل")}
            {activeAsset.asset_code ? ` · ${String(activeAsset.asset_code)}` : ""}
            {activeAsset.location_note ? ` · ${String(activeAsset.location_note)}` : ""}
          </div>
        </div>
      ) : null}

      {!activeAsset && visitSystems.length > 1 ? (
        <div className="badge-wrap" style={{ marginTop: "14px" }}>
          {visitSystems.map((system) => {
            const active =
              String(system.visit_system_id) === String(selectedSystemId);

            return (
              <button
                key={system.visit_system_id}
                type="button"
                onClick={() => setSelectedSystemId(String(system.visit_system_id))}
                className={active ? "badge badge-active" : "badge"}
                style={{
                  border: active ? "1px solid #0f766e" : "1px solid #e2e8f0",
                  background: active ? "#0f766e" : "#ffffff",
                  color: active ? "#ffffff" : "#0f172a",
                  padding: "10px 18px",
                  borderRadius: "999px",
                  fontWeight: 700,
                }}
              >
                {system.system_code}
              </button>
            );
          })}
        </div>
      ) : null}

      {selectedSystem ? (
        <div className="section-subtitle" style={{ marginTop: "12px" }}>
          النظام الحالي: {selectedSystem.system_code}
        </div>
      ) : null}

      {selectedItems.length === 0 ? (
        <div style={{ marginTop: "16px" }} className="muted-note">
          لا توجد بنود فحص لهذا النظام داخل هذه الزيارة.
        </div>
      ) : (
        <div className="stack-3" style={{ marginTop: "16px" }}>
          {selectedItems.map((item, index) => {
            const state = getItemState(item);
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

            const smart = isSmartItem(item);
            const isNonCompliant =
              String(state.response_value) === "non_compliant";

            return (
              <div
                key={`${item.visit_system_id}-${item.checklist_item_id}`}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "24px",
                  background: "#ffffff",
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "18px 16px 8px" }}>
                  <div className="checklist-item-section">
                    {item.section_name || "Section"} · بند {index + 1}
                  </div>

                  <div
                    className="checklist-item-title"
                    style={{ marginTop: "10px" }}
                  >
                    {item.question_text}
                  </div>

                  {item.acceptance_criteria ? (
                    <div
                      className="checklist-item-criteria"
                      style={{ marginTop: "10px" }}
                    >
                      {item.acceptance_criteria}
                    </div>
                  ) : null}

                  <div className="badge-wrap" style={{ marginTop: "10px" }}>
                    {smartBadgeText(item) ? (
                      <span className="badge">{smartBadgeText(item)}</span>
                    ) : null}

                    {item.numeric_unit ? (
                      <span className="badge">الوحدة: {item.numeric_unit}</span>
                    ) : null}

                    {targetText(item) ? (
                      <span className="badge">{targetText(item)}</span>
                    ) : null}

                    {baselineRow ? (
                      <span className="badge">
                        Baseline: {baselineRow.metric_name_ar || baselineRow.metric_code}
                      </span>
                    ) : null}
                  </div>

                  {baselineRow ? (
                    <div
                      style={{
                        marginTop: "10px",
                        border: "1px solid #fcd34d",
                        background: "#fffbeb",
                        color: "#92400e",
                        borderRadius: "16px",
                        padding: "12px",
                        fontSize: "14px",
                        lineHeight: 1.8,
                      }}
                    >
                      مرجع الأصل: {baselineRow.metric_name_ar || baselineRow.metric_code}
                      {baselineRow.ref_value ? ` · القيمة المرجعية 1: ${baselineRow.ref_value}` : ""}
                      {baselineRow.ref_value_2 ? ` · القيمة المرجعية 2: ${baselineRow.ref_value_2}` : ""}
                      {baselineRow.ref_value_3 ? ` · القيمة المرجعية 3: ${baselineRow.ref_value_3}` : ""}
                      {baselineRow.metric_unit ? ` · الوحدة: ${baselineRow.metric_unit}` : ""}
                      {baselineRow.baseline_date ? ` · التاريخ: ${baselineRow.baseline_date}` : ""}
                    </div>
                  ) : null}

                  {item
